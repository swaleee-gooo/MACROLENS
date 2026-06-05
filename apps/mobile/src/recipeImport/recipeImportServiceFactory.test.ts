import { describe, expect, it, vi } from 'vitest';
import { createRecipeImportService } from './recipeImportServiceFactory';
import type { RecipeImportService } from './recipeSchema';
import { resolveAppEnv } from '../config/env';

const remoteEnv = resolveAppEnv({
  EXPO_PUBLIC_ANALYSIS_MODE: 'remote',
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_123',
});

const mockEnv = resolveAppEnv({ EXPO_PUBLIC_ANALYSIS_MODE: 'mock' });

function stubService(label: string): RecipeImportService {
  return { extractRecipeFromUrl: vi.fn().mockResolvedValue({ label }) as never };
}

describe('createRecipeImportService', () => {
  it('uses the mock service when remote mode is not configured', async () => {
    const service = createRecipeImportService(mockEnv);
    const recipe = await service.extractRecipeFromUrl({ url: 'https://vm.tiktok.com/ZGabc/', userId: 'u' });
    expect(recipe.sourcePlatform).toBe('tiktok');
  });

  it('uses the remote override when remote mode is configured', async () => {
    const remote = stubService('remote');
    const service = createRecipeImportService(remoteEnv, { remote });
    await service.extractRecipeFromUrl({ url: 'https://x.test', userId: 'u' });
    expect(remote.extractRecipeFromUrl).toHaveBeenCalledOnce();
  });

  it('prefers the mock override in mock mode', async () => {
    const mock = stubService('mock');
    const service = createRecipeImportService(mockEnv, { mock });
    await service.extractRecipeFromUrl({ url: 'https://x.test', userId: 'u' });
    expect(mock.extractRecipeFromUrl).toHaveBeenCalledOnce();
  });
});
