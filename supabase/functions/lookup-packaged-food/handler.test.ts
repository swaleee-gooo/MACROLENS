import { describe, expect, it } from 'vitest';
import { handleLookupPackagedFood } from './handler.ts';

describe('handleLookupPackagedFood', () => {
  it('requires a barcode', async () => {
    const response = await handleLookupPackagedFood(
      new Request('https://example.test/lookup-packaged-food', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'barcode_required' });
  });

  it('returns the Open Food Facts product payload for a barcode', async () => {
    const response = await handleLookupPackagedFood(
      new Request('https://example.test/lookup-packaged-food', {
        method: 'POST',
        body: JSON.stringify({ barcode: '3017620422003' }),
      }),
      {
        fetchProduct: async () =>
          new Response(
            JSON.stringify({
              product: {
                product_name: 'Nutella',
                nutriments: { 'energy-kcal_100g': 539 },
              },
            }),
          ),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: '3017620422003',
      product: {
        product_name: 'Nutella',
        nutriments: { 'energy-kcal_100g': 539 },
      },
    });
  });
});
