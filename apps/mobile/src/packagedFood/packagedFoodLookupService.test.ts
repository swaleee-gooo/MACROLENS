import { describe, expect, it } from 'vitest';
import { createPackagedFoodLookupService } from './packagedFoodLookupService';

describe('createPackagedFoodLookupService', () => {
  it('uses the Supabase product lookup function before direct Open Food Facts fetch', async () => {
    let anonymousAuthCalled = false;
    const service = createPackagedFoodLookupService({
      supabaseClient: {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          signInAnonymously: async () => {
            anonymousAuthCalled = true;
            return { data: { session: { user: { id: 'anon-user' } }, user: { id: 'anon-user' } }, error: null };
          },
        },
        functions: {
          invoke: async (name, options) => ({
            data: {
              code: options.body.barcode,
              product: {
                product_name: 'Mayonnaise',
                nutriments: {
                  'energy-kcal_100g': 680,
                  proteins_100g: 1.2,
                  carbohydrates_100g: 2.1,
                  fat_100g: 75,
                },
              },
            },
            error: null,
          }),
        },
      },
      fetchProduct: async () => {
        throw new Error('direct_fetch_should_not_be_called');
      },
    });

    const item = await service.lookupProduct('3017620422003');

    expect(anonymousAuthCalled).toBe(true);
    expect(item).toMatchObject({
      barcode: '3017620422003',
      name: 'Mayonnaise',
      caloriesPer100g: 680,
      fatPer100g: 75,
      source: 'open_food_facts',
    });
  });

  it('falls back to direct Open Food Facts lookup if the backend function is unavailable', async () => {
    const service = createPackagedFoodLookupService({
      supabaseClient: {
        functions: {
          invoke: async () => ({ data: null, error: { message: 'not deployed' } }),
        },
      },
      fetchProduct: async () =>
        new Response(
          JSON.stringify({
            code: '3017620422003',
            product: {
              product_name: 'Nutella',
              nutriments: { 'energy-kcal_100g': 539, proteins_100g: 6.3 },
            },
          }),
        ),
    });

    const item = await service.lookupProduct('3017620422003');

    expect(item.name).toBe('Nutella');
    expect(item.caloriesPer100g).toBe(539);
  });

  it('falls back to direct lookup if anonymous auth fails before backend lookup', async () => {
    const service = createPackagedFoodLookupService({
      supabaseClient: {
        auth: {
          getSession: async () => ({ data: { session: null }, error: 'session_failed' }),
          signInAnonymously: async () => ({ data: { session: null, user: null }, error: null }),
        },
        functions: {
          invoke: async () => {
            throw new Error('backend_should_not_be_called');
          },
        },
      },
      fetchProduct: async () =>
        new Response(
          JSON.stringify({
            code: '3017620422003',
            product: {
              product_name: 'Nutella',
              nutriments: { 'energy-kcal_100g': 539 },
            },
          }),
        ),
    });

    const item = await service.lookupProduct('3017620422003');

    expect(item.name).toBe('Nutella');
  });
});
