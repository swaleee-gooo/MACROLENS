import { ensureAnonymousUserId } from '../supabase/session';
import { lookupOpenFoodFactsProduct, mapOpenFoodFactsProduct } from './openFoodFacts';
import type { PackagedFoodItem } from './packagedFoodSchema';

export type SupabaseLookupClient = {
  auth?: {
    getSession(): Promise<{ data: { session: { user: { id: string } } | null }; error: unknown }>;
    signInAnonymously(): Promise<{
      data: { session: { user: { id: string } } | null; user: { id: string } | null };
      error: unknown;
    }>;
  };
  functions: {
    invoke(name: string, options: { body: { barcode: string } }): Promise<{ data: unknown; error: unknown }>;
  };
};

type FetchProduct = (url: string) => Promise<Response>;

export type LookupConfig = {
  supabaseClient?: SupabaseLookupClient | null;
  fetchProduct?: FetchProduct;
};

export function createPackagedFoodLookupService({ supabaseClient = null, fetchProduct = fetch }: LookupConfig = {}) {
  return {
    async lookupProduct(barcode: string): Promise<PackagedFoodItem> {
      if (supabaseClient) {
        try {
          if (supabaseClient.auth) {
            await ensureAnonymousUserId(supabaseClient.auth);
          }

          const result = await supabaseClient.functions.invoke('lookup-packaged-food', {
            body: { barcode },
          });

          if (!result.error && result.data) {
            return mapOpenFoodFactsProduct(result.data as Parameters<typeof mapOpenFoodFactsProduct>[0]);
          }
        } catch {
          // Fall back to direct Open Food Facts so product scan remains usable if the Edge Function or anonymous auth is down.
        }
      }

      return lookupOpenFoodFactsProduct(barcode, fetchProduct);
    },
  };
}
