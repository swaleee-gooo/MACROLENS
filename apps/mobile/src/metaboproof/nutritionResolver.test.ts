import { describe, expect, it } from 'vitest';
import { createNutritionResolver, createOpenFoodFactsConnector, createUsdaFoodDataCentralConnector } from './nutritionResolver';
import type { NutritionSource } from './types';

describe('MetaboProof nutrition resolver', () => {
  it('maps USDA FoodData Central search results into per-100g sources', async () => {
    const connector = createUsdaFoodDataCentralConnector({
      apiKey: 'demo-key',
      fetchJson: async (url) => {
        expect(url).toContain('/fdc/v1/foods/search');
        expect(url).toContain('api_key=demo-key');
        return {
          foods: [
            {
              fdcId: 171077,
              description: 'Chicken breast cooked',
              foodNutrients: [
                { nutrientName: 'Energy', unitName: 'KCAL', value: 165 },
                { nutrientName: 'Protein', unitName: 'G', value: 31 },
                { nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: 0 },
                { nutrientName: 'Total lipid (fat)', unitName: 'G', value: 3.6 },
              ],
            },
          ],
        };
      },
    });

    await expect(connector.search('chicken breast')).resolves.toEqual({
      provider: 'USDA_FDC',
      externalId: '171077',
      name: 'Chicken breast cooked',
      kcalPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
    });
  });

  it('maps Open Food Facts barcode products into per-100g sources', async () => {
    const connector = createOpenFoodFactsConnector({
      fetchJson: async (url) => {
        expect(url).toContain('/api/v2/product/3017620422003.json');
        return {
          code: '3017620422003',
          product: {
            product_name: 'Nutella',
            brands: 'Ferrero',
            nutriments: {
              'energy-kcal_100g': '539',
              proteins_100g: '6.3',
              carbohydrates_100g: '57.5',
              fat_100g: '30.9',
            },
          },
        };
      },
    });

    await expect(connector.lookupBarcode('3017620422003')).resolves.toEqual({
      provider: 'OPEN_FOOD_FACTS',
      externalId: '3017620422003',
      name: 'Nutella - Ferrero',
      kcalPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
    });
  });

  it('resolves barcode before label and falls back to a custom user source', async () => {
    const custom: NutritionSource = {
      provider: 'USER_CUSTOM',
      externalId: 'custom-rice',
      name: 'Rice from user',
      kcalPer100g: 130,
      proteinPer100g: 2.7,
      carbsPer100g: 28,
      fatPer100g: 0.3,
    };
    const resolver = createNutritionResolver({
      openFoodFacts: { lookupBarcode: async () => null },
      usda: { search: async () => null },
      customSources: [custom],
    });

    await expect(resolver.resolve({ label: 'rice' })).resolves.toEqual(custom);
  });
});
