import { describe, expect, it } from 'vitest';
import { lookupOpenFoodFactsProduct, mapOpenFoodFactsProduct } from './openFoodFacts';

describe('mapOpenFoodFactsProduct', () => {
  it('maps product nutriments per 100g into a packaged food item', () => {
    const item = mapOpenFoodFactsProduct({
      code: '3017620422003',
      product: {
        product_name: 'Nutella',
        nutriments: {
          'energy-kcal_100g': 539,
          proteins_100g: 6.3,
          carbohydrates_100g: 57.5,
          fat_100g: 30.9,
          fiber_100g: 0,
        },
      },
    });

    expect(item).toEqual({
      barcode: '3017620422003',
      name: 'Nutella',
      caloriesPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });
  });

  it('fetches and maps a product by barcode', async () => {
    const item = await lookupOpenFoodFactsProduct('3017620422003', async () =>
      new Response(
        JSON.stringify({
          code: '3017620422003',
          product: {
            product_name: 'Nutella',
            nutriments: {
              'energy-kcal_100g': 539,
              proteins_100g: 6.3,
            },
          },
        }),
      ),
    );

    expect(item.name).toBe('Nutella');
    expect(item.caloriesPer100g).toBe(539);
    expect(item.proteinPer100g).toBe(6.3);
  });
});
