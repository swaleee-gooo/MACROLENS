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
    const calls: Array<{ url: string; userAgent: string | null }> = [];
    const response = await handleLookupPackagedFood(
      new Request('https://example.test/lookup-packaged-food', {
        method: 'POST',
        body: JSON.stringify({ barcode: '3017620422003' }),
      }),
      {
        fetchProduct: async (url, init) => {
          calls.push({ url, userAgent: new Headers(init?.headers).get('user-agent') });
          return new Response(
            JSON.stringify({
              code: '3017620422003',
              product: {
                product_name: 'Nutella',
                nutriments: { 'energy-kcal_100g': 539 },
              },
            }),
          );
        },
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
    expect(calls[0].url).toContain('fields=');
    expect(calls[0].userAgent).toBe('MacroLens/1.0 packaged-food-lookup');
  });

  it('tries UPC/EAN variants and French host before giving up', async () => {
    const calls: string[] = [];
    const response = await handleLookupPackagedFood(
      new Request('https://example.test/lookup-packaged-food', {
        method: 'POST',
        body: JSON.stringify({ barcode: '012345678905' }),
      }),
      {
        fetchProduct: async (url) => {
          calls.push(url);
          if (calls.length < 4) {
            return new Response(JSON.stringify({ status: 0 }));
          }

          return new Response(
            JSON.stringify({
              code: '0012345678905',
              product: {
                product_name_fr: 'Produit FR',
                nutriments: { 'energy-kcal_100g': 120 },
              },
            }),
          );
        },
      },
    );

    expect(response.status).toBe(200);
    expect(calls.some((url) => url.includes('fr.openfoodfacts.org'))).toBe(true);
    expect(calls.some((url) => url.includes('0012345678905'))).toBe(true);
  });
});
