import { createMockRecipeImportService } from './mockRecipeImportService';
import { createRemoteRecipeImportService } from './remoteRecipeImportService';
import type { RecipeImportService } from './recipeSchema';
import type { AppEnv } from '../config/env';

type RecipeImportServiceOverrides = {
  mock?: RecipeImportService;
  remote?: RecipeImportService;
};

/**
 * Picks the recipe import service the same way `createAnalysisService` does:
 * the remote edge function when Supabase remote mode is configured, otherwise the
 * deterministic mock. Unlike the photo analyzer there is no silent mock fallback
 * on remote failure — surfacing a typed error keeps the imported recipe honest
 * rather than quietly swapping in a fake one.
 */
export function createRecipeImportService(env: AppEnv, overrides: RecipeImportServiceOverrides = {}): RecipeImportService {
  if (env.analysisMode === 'remote' && env.supabaseUrl && env.supabaseAnonKey) {
    return (
      overrides.remote ??
      createRemoteRecipeImportService({
        supabaseUrl: env.supabaseUrl,
        supabaseAnonKey: env.supabaseAnonKey,
      })
    );
  }

  return overrides.mock ?? createMockRecipeImportService();
}
