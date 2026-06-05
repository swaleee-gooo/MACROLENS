import type { NutritionSource } from './types';

type FetchJson = (url: string) => Promise<unknown>;

type UsdaFood = {
  fdcId?: number | string;
  description?: string;
  foodNutrients?: Array<{
    nutrientName?: string;
    nutrientNumber?: string;
    unitName?: string;
    value?: number | string;
  }>;
};

type UsdaSearchResponse = {
  foods?: UsdaFood[];
};

type OpenFoodFactsResponse = {
  code?: string;
  status?: number;
  product?: {
    product_name_fr?: string;
    product_name?: string;
    brands?: string;
    nutriments?: Record<string, unknown>;
  };
};

export type UsdaConnector = {
  search(label: string): Promise<NutritionSource | null>;
};

export type OpenFoodFactsConnector = {
  lookupBarcode(barcode: string): Promise<NutritionSource | null>;
};

async function defaultFetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  return response.json();
}

function numberField(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function nutrientValue(food: UsdaFood, names: string[], nutrientNumbers: string[] = []): number {
  const nutrients = food.foodNutrients ?? [];
  const match = nutrients.find((nutrient) => {
    const name = nutrient.nutrientName?.toLowerCase() ?? '';
    const number = nutrient.nutrientNumber ?? '';
    return names.some((candidate) => name.includes(candidate)) || nutrientNumbers.includes(number);
  });

  return numberField(match?.value);
}

function mapUsdaFood(food: UsdaFood): NutritionSource | null {
  const externalId = food.fdcId?.toString();
  const name = food.description?.trim();
  if (!externalId || !name) {
    return null;
  }

  return {
    provider: 'USDA_FDC',
    externalId,
    name,
    kcalPer100g: nutrientValue(food, ['energy'], ['208']),
    proteinPer100g: nutrientValue(food, ['protein'], ['203']),
    carbsPer100g: nutrientValue(food, ['carbohydrate'], ['205']),
    fatPer100g: nutrientValue(food, ['total lipid', 'fat'], ['204']),
  };
}

function caloriesFromOpenFoodFacts(nutriments: Record<string, unknown>): number {
  const kcal = numberField(nutriments['energy-kcal_100g']);
  if (kcal > 0) {
    return kcal;
  }

  const kj = numberField(nutriments.energy_100g);
  return kj > 0 ? Math.round(kj / 4.184) : 0;
}

function mapOpenFoodFacts(response: OpenFoodFactsResponse, barcode: string): NutritionSource | null {
  if (response.status === 0 || !response.product) {
    return null;
  }

  const nutriments = response.product.nutriments ?? {};
  const brand = response.product.brands?.split(',')[0]?.trim();
  const baseName = response.product.product_name_fr || response.product.product_name || brand || 'Scanned product';
  const name = brand && !baseName.toLowerCase().includes(brand.toLowerCase()) ? `${baseName} - ${brand}` : baseName;

  return {
    provider: 'OPEN_FOOD_FACTS',
    externalId: response.code || barcode,
    name,
    kcalPer100g: caloriesFromOpenFoodFacts(nutriments),
    proteinPer100g: numberField(nutriments.proteins_100g),
    carbsPer100g: numberField(nutriments.carbohydrates_100g),
    fatPer100g: numberField(nutriments.fat_100g),
  };
}

export function createUsdaFoodDataCentralConnector({
  apiKey,
  fetchJson = defaultFetchJson,
}: {
  apiKey: string;
  fetchJson?: FetchJson;
}): UsdaConnector {
  return {
    async search(label) {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(label)}&pageSize=1`;
      const payload = (await fetchJson(url)) as UsdaSearchResponse | null;
      const firstFood = payload?.foods?.[0];
      return firstFood ? mapUsdaFood(firstFood) : null;
    },
  };
}

export function createOpenFoodFactsConnector({ fetchJson = defaultFetchJson }: { fetchJson?: FetchJson } = {}): OpenFoodFactsConnector {
  return {
    async lookupBarcode(barcode) {
      const fields = encodeURIComponent('code,product_name_fr,product_name,brands,nutriments');
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`;
      return mapOpenFoodFacts((await fetchJson(url)) as OpenFoodFactsResponse, barcode);
    },
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function findCustomSource(label: string | undefined, customSources: NutritionSource[]): NutritionSource | null {
  if (!label) {
    return null;
  }

  const normalizedLabel = normalize(label);
  return (
    customSources.find((source) => {
      const normalizedName = normalize(source.name);
      const normalizedId = normalize(source.externalId);
      return normalizedName.includes(normalizedLabel) || normalizedLabel.includes(normalizedName) || normalizedId.includes(normalizedLabel);
    }) ?? null
  );
}

export function createNutritionResolver({
  usda,
  openFoodFacts,
  customSources = [],
}: {
  usda?: UsdaConnector;
  openFoodFacts?: OpenFoodFactsConnector;
  customSources?: NutritionSource[];
}) {
  return {
    async resolve(input: { label?: string; barcode?: string }): Promise<NutritionSource | null> {
      if (input.barcode && openFoodFacts) {
        const product = await openFoodFacts.lookupBarcode(input.barcode);
        if (product) {
          return product;
        }
      }

      if (input.label && usda) {
        const food = await usda.search(input.label);
        if (food) {
          return food;
        }
      }

      return findCustomSource(input.label, customSources);
    },
  };
}
