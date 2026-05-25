import { describe, expect, it } from 'vitest';
import { lookupOpenFoodFactsProduct, mapOpenFoodFactsProduct, normalizeBarcodeCandidates } from './openFoodFacts';

describe('normalizeBarcodeCandidates', () => {
  it('tries UPC and EAN variants for the same product', () => {
    expect(normalizeBarcodeCandidates(' 012345678905 ')).toEqual(['012345678905', '0012345678905']);
    expect(normalizeBarcodeCandidates('0012345678905')).toEqual(['0012345678905', '012345678905']);
  });
});

describe('mapOpenFoodFactsProduct', () => {
  it('maps product nutriments per 100g into a packaged food item', () => {
    const item = mapOpenFoodFactsProduct({
      code: '3017620422003',
      product: {
        product_name: 'Nutella',
        brands: 'Ferrero',
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
      name: 'Nutella - Ferrero',
      caloriesPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });
  });

  it('fetches and maps a product by barcode', async () => {
    const urls: string[] = [];
    const item = await lookupOpenFoodFactsProduct('3017620422003', async (url) => {
      urls.push(url);
      return new Response(
        JSON.stringify({
          code: '3017620422003',
          product: {
            product_name: 'Nutella',
            nutriments: {
              'energy-kcal_100g': '539',
              proteins_100g: '6.3',
            },
          },
        }),
      );
    });

    expect(item.name).toBe('Nutella');
    expect(item.caloriesPer100g).toBe(539);
    expect(item.proteinPer100g).toBe(6.3);
    expect(urls[0]).toContain('/api/v2/product/3017620422003.json');
    expect(urls[0]).toContain('fields=');
  });

  it('falls back to the French Open Food Facts host when world lookup misses', async () => {
    let callCount = 0;
    const item = await lookupOpenFoodFactsProduct('3017620422003', async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ code: '3017620422003', status: 0 }));
      }

      return new Response(
        JSON.stringify({
          code: '3017620422003',
          product: {
            product_name_fr: 'Pate a tartiner',
            nutriments: {
              energy_100g: 2255,
              proteins_100g: 6.3,
            },
          },
        }),
      );
    });

    expect(item.name).toBe('Pate a tartiner');
    expect(item.caloriesPer100g).toBe(539);
  });
});
