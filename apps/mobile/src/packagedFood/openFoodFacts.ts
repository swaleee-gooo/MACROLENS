import type { PackagedFoodItem } from './packagedFoodSchema';

type OpenFoodFactsProductResponse = {
  code: string;
  status?: number;
  product?: {
    product_name_fr?: string;
    product_name?: string;
    brands?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
};

type FetchProduct = (url: string) => Promise<Response>;

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

function caloriesPer100g(nutriments: Record<string, number | string | undefined>): number {
  const kcal = numberField(nutriments['energy-kcal_100g']);
  if (kcal > 0) {
    return kcal;
  }

  const energyKj = numberField(nutriments.energy_100g);
  return energyKj > 0 ? energyKj / 4.184 : 0;
}

function hasUsableNutrition(item: PackagedFoodItem): boolean {
  return item.caloriesPer100g > 0 || item.proteinPer100g > 0 || item.carbsPer100g > 0 || item.fatPer100g > 0;
}

function unique(values: string[]): string[] {
  return values.filter((value, index) => value.length > 0 && values.indexOf(value) === index);
}

export function normalizeBarcodeCandidates(rawBarcode: string): string[] {
  const compact = rawBarcode.trim();
  const digits = compact.replace(/\D/g, '');
  const candidates = [compact, digits];

  if (digits.length === 12) {
    candidates.push(`0${digits}`);
  }

  if (digits.length === 13 && digits.startsWith('0')) {
    candidates.push(digits.slice(1));
  }

  return unique(candidates);
}

export function mapOpenFoodFactsProduct(response: OpenFoodFactsProductResponse): PackagedFoodItem {
  const nutriments = response.product?.nutriments ?? {};
  const brand = response.product?.brands?.split(',')[0]?.trim();
  const name = response.product?.product_name_fr || response.product?.product_name || brand || 'Produit scanne';

  return {
    barcode: response.code,
    name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} - ${brand}` : name,
    caloriesPer100g: Math.round(caloriesPer100g(nutriments)),
    proteinPer100g: numberField(nutriments.proteins_100g),
    carbsPer100g: numberField(nutriments.carbohydrates_100g),
    fatPer100g: numberField(nutriments.fat_100g),
    fiberPer100g: numberField(nutriments.fiber_100g),
    source: 'open_food_facts',
  };
}

const openFoodFactsFields = 'code,product_name_fr,product_name,brands,nutriments';
const openFoodFactsHosts = ['https://world.openfoodfacts.org', 'https://fr.openfoodfacts.org'];

export async function lookupOpenFoodFactsProduct(barcode: string, fetchProduct: FetchProduct = fetch): Promise<PackagedFoodItem> {
  let foundWithoutNutrition = false;

  for (const candidate of normalizeBarcodeCandidates(barcode)) {
    for (const host of openFoodFactsHosts) {
      const response = await fetchProduct(
        `${host}/api/v2/product/${encodeURIComponent(candidate)}.json?fields=${encodeURIComponent(openFoodFactsFields)}`,
      );

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as OpenFoodFactsProductResponse;
      if (payload.status === 0 || !payload.product) {
        continue;
      }

      const item = mapOpenFoodFactsProduct({
        ...payload,
        code: payload.code || candidate,
      });

      if (!hasUsableNutrition(item)) {
        foundWithoutNutrition = true;
        continue;
      }

      return item;
    }
  }

  if (foundWithoutNutrition) {
    throw new Error('product_nutrition_missing');
  }

  throw new Error('product_not_found');
}
