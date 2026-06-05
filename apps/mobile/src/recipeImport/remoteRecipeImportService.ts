import { RecipeExtractionFailedError, UnsupportedRecipeUrlError } from './recipeImportErrors';
import { importedRecipeSchema, type RecipeImportService } from './recipeSchema';
import { createMacroLensSupabaseClient } from '../supabase/client';
import { ensureAnonymousUserId } from '../supabase/session';

type RemoteConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type SupabaseLike = {
  auth: {
    getSession(): Promise<{ data: { session: { user: { id: string } } | null }; error: unknown }>;
    signInAnonymously(): Promise<{
      data: { session: { user: { id: string } } | null; user: { id: string } | null };
      error: unknown;
    }>;
  };
  functions: {
    invoke(name: string, options: { body: unknown }): Promise<{ data: unknown; error: unknown }>;
  };
};

type EdgeErrorPayload = {
  error?: unknown;
  message?: unknown;
};

function edgeError(payload: unknown): EdgeErrorPayload | null {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return null;
  }

  return payload as EdgeErrorPayload;
}

async function getFunctionErrorPayload(error: unknown): Promise<unknown> {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (typeof context?.json !== 'function') {
    return null;
  }

  try {
    return await context.json();
  } catch {
    return null;
  }
}

function throwForEdgeError(payload: EdgeErrorPayload): never {
  const message = typeof payload.message === 'string' ? payload.message : undefined;
  if (payload.error === 'unsupported_recipe_url') {
    throw new UnsupportedRecipeUrlError('unsupported_recipe_url', message);
  }

  throw new RecipeExtractionFailedError('recipe_extraction_failed', message);
}

export function createRemoteRecipeImportService(config: RemoteConfig, client?: SupabaseLike): RecipeImportService {
  const supabase = client ?? (createMacroLensSupabaseClient(config.supabaseUrl, config.supabaseAnonKey) as unknown as SupabaseLike);

  return {
    async extractRecipeFromUrl({ url }) {
      await ensureAnonymousUserId(supabase.auth);

      const functionResult = await supabase.functions.invoke('extract-recipe', {
        body: { url },
      });

      const directError = edgeError(functionResult.data);
      if (directError) {
        throwForEdgeError(directError);
      }

      if (functionResult.error) {
        const wrappedPayload = edgeError(await getFunctionErrorPayload(functionResult.error));
        if (wrappedPayload) {
          throwForEdgeError(wrappedPayload);
        }

        throw new RecipeExtractionFailedError();
      }

      return importedRecipeSchema.parse(functionResult.data);
    },
  };
}
