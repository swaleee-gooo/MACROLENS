import type { PackagedFoodItem } from './packagedFoodSchema';

type OpenFoodFactsProductResponse = {
  code: string;
  product?: {
    product_name?: string;
    nutriments?: Record<string, number | undefined>;
  };
};

type FetchProduct = (url: string) => Promise<Response>;

function numberField(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function mapOpenFoodFactsProduct(response: OpenFoodFactsProductResponse): PackagedFoodItem {
  const nutriments = response.product?.nutriments ?? {};

  return {
    barcode: response.code,
    name: response.product?.product_name || 'Produit scanne',
    caloriesPer100g: numberField(nutriments['energy-kcal_100g']),
    proteinPer100g: numberField(nutriments.proteins_100g),
    carbsPer100g: numberField(nutriments.carbohydrates_100g),
    fatPer100g: numberField(nutriments.fat_100g),
    fiberPer100g: numberField(nutriments.fiber_100g),
    source: 'open_food_facts',
  };
}

export async function lookupOpenFoodFactsProduct(barcode: string, fetchProduct: FetchProduct = fetch): Promise<PackagedFoodItem> {
  const response = await fetchProduct(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
  if (!response.ok) {
    throw new Error('open_food_facts_failed');
  }

  const payload = (await response.json()) as OpenFoodFactsProductResponse;
  if (!payload.product) {
    throw new Error('product_not_found');
  }

  return mapOpenFoodFactsProduct({
    ...payload,
    code: payload.code || barcode,
  });
}
