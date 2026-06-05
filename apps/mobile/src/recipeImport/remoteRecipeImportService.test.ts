import { describe, expect, it, vi } from 'vitest';
import { RecipeExtractionFailedError, UnsupportedRecipeUrlError } from './recipeImportErrors';
import { createRemoteRecipeImportService } from './remoteRecipeImportService';

function validRecipePayload() {
  return {
    title: 'Bol de poulet teriyaki',
    summary: 'Bol viral',
    sourceUrl: 'https://vm.tiktok.com/ZGabc/',
    sourcePlatform: 'tiktok',
    sourceAuthor: '@chef',
    imageUrl: 'https://cdn.example/thumb.jpg',
    servings: 2,
    ingredients: [{ name: 'Poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 }],
    steps: ['Cuire le poulet'],
  };
}

type InvokeFn = (name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }>;

function makeService(invoke: InvokeFn, sessionUser: { id: string } | null = { id: 'auth-user' }) {
  const getSession = vi.fn().mockResolvedValue({ data: { session: sessionUser ? { user: sessionUser } : null }, error: null });
  const signInAnonymously = vi.fn().mockResolvedValue({
    data: { session: { user: { id: 'auth-user' } }, user: { id: 'auth-user' } },
    error: null,
  });

  return createRemoteRecipeImportService(
    { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'sb_publishable_123' },
    { auth: { getSession, signInAnonymously }, functions: { invoke } },
  );
}

describe('createRemoteRecipeImportService', () => {
  it('invokes extract-recipe with the URL and returns the parsed recipe', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: validRecipePayload(), error: null });
    const service = makeService(invoke);

    const recipe = await service.extractRecipeFromUrl({ url: 'https://vm.tiktok.com/ZGabc/', userId: 'local-user' });

    expect(invoke).toHaveBeenCalledWith('extract-recipe', { body: { url: 'https://vm.tiktok.com/ZGabc/' } });
    expect(recipe.title).toBe('Bol de poulet teriyaki');
    expect(recipe.ingredients).toHaveLength(1);
  });

  it('signs in anonymously when there is no session', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: validRecipePayload(), error: null });
    const service = makeService(invoke, null);
    await service.extractRecipeFromUrl({ url: 'https://vm.tiktok.com/ZGabc/', userId: 'local-user' });
    expect(invoke).toHaveBeenCalledOnce();
  });

  it('throws a typed unsupported-url error from a direct edge payload', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { error: 'unsupported_recipe_url', message: 'nope' }, error: null });
    const service = makeService(invoke);
    await expect(service.extractRecipeFromUrl({ url: 'https://x.test', userId: 'u' })).rejects.toBeInstanceOf(
      UnsupportedRecipeUrlError,
    );
  });

  it('throws a typed extraction error from a wrapped function error payload', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { context: { json: async () => ({ error: 'extraction_failed', message: 'no recipe' }) } },
    });
    const service = makeService(invoke);
    await expect(service.extractRecipeFromUrl({ url: 'https://x.test', userId: 'u' })).rejects.toBeInstanceOf(
      RecipeExtractionFailedError,
    );
  });

  it('throws a generic extraction error when the function fails opaquely', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const service = makeService(invoke);
    await expect(service.extractRecipeFromUrl({ url: 'https://x.test', userId: 'u' })).rejects.toBeInstanceOf(
      RecipeExtractionFailedError,
    );
  });
});
