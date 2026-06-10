import { describe, expect, it } from 'vitest';
import { handleLookupPackagedFood } from './handler.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.signature`;
}

const authHeaders = { authorization: `Bearer ${fakeJwt('user-1')}` };

describe('handleLookupPackagedFood', () => {
  it('requires an authenticated Supabase user', async () => {
    const response = await handleLookupPackagedFood(
      new Request('https://example.test/lookup-packaged-food', {
        method: 'POST',
        body: JSON.stringify({ barcode: '3017620422003' }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'missing_or_invalid_authorization' });
  });

  it('requires a barcode', async () => {
    const response = await handleLookupPackagedFood(
      new Request('https://example.test/lookup-packaged-food', {
        method: 'POST',
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
