import { describe, expect, it } from 'vitest';
import { createMockRecipeImportService } from './mockRecipeImportService';
import { importedRecipeSchema } from './recipeSchema';

describe('createMockRecipeImportService', () => {
  it('returns a schema-valid recipe that echoes the source URL and platform', async () => {
    const service = createMockRecipeImportService();
    const recipe = await service.extractRecipeFromUrl({ url: 'https://vm.tiktok.com/ZGabc/', userId: 'user-1' });

    expect(() => importedRecipeSchema.parse(recipe)).not.toThrow();
    expect(recipe.sourceUrl).toBe('https://vm.tiktok.com/ZGabc/');
    expect(recipe.sourcePlatform).toBe('tiktok');
    expect(recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipe.servings).toBeGreaterThan(0);
  });

  it('detects a web source for a generic recipe page', async () => {
    const service = createMockRecipeImportService();
    const recipe = await service.extractRecipeFromUrl({ url: 'https://marmiton.org/recettes/42', userId: 'user-1' });
    expect(recipe.sourcePlatform).toBe('web');
  });
});
