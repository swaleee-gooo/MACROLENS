import { describe, expect, it } from 'vitest';
import type { ImportedRecipe } from '../recipeImport/recipeSchema';
import { createMemoryStorageAdapter } from './mealRepository';
import { createRecipeRepository, recipeStorageId } from './recipeRepository';

function recipe(overrides: Partial<ImportedRecipe> = {}): ImportedRecipe {
  return {
    title: 'Bol de poulet TikTok',
    summary: '',
    sourceUrl: 'https://vm.tiktok.com/ZGabc/',
    sourcePlatform: 'tiktok',
    sourceAuthor: '@chef',
    imageUrl: null,
    servings: 2,
    statedCaloriesPerServing: null,
    statedProteinPerServing: null,
    statedCarbsPerServing: null,
    statedFatPerServing: null,
    ingredients: [{ name: 'Poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 }],
    steps: [],
    ...overrides,
  };
}

describe('recipeRepository', () => {
  it('saves and lists recipes, newest first', async () => {
    const repo = createRecipeRepository(createMemoryStorageAdapter());
    await repo.saveRecipe(recipe({ title: 'A', sourceUrl: 'https://a.test' }), '2026-06-01T00:00:00.000Z');
    await repo.saveRecipe(recipe({ title: 'B', sourceUrl: 'https://b.test' }), '2026-06-02T00:00:00.000Z');

    const list = await repo.listRecipes();
    expect(list.map((entry) => entry.recipe.title)).toEqual(['B', 'A']);
  });

  it('dedupes by source URL (re-import updates the entry)', async () => {
    const repo = createRecipeRepository(createMemoryStorageAdapter());
    await repo.saveRecipe(recipe({ title: 'Old', sourceUrl: 'https://same.test' }), '2026-06-01T00:00:00.000Z');
    await repo.saveRecipe(recipe({ title: 'New', sourceUrl: 'https://same.test' }), '2026-06-03T00:00:00.000Z');

    const list = await repo.listRecipes();
    expect(list).toHaveLength(1);
    expect(list[0].recipe.title).toBe('New');
  });

  it('deletes a recipe by id', async () => {
    const repo = createRecipeRepository(createMemoryStorageAdapter());
    const target = recipe({ sourceUrl: 'https://del.test' });
    await repo.saveRecipe(target, '2026-06-01T00:00:00.000Z');
    await repo.deleteRecipe(recipeStorageId(target));
    expect(await repo.listRecipes()).toEqual([]);
  });

  it('falls back to platform + title when there is no source URL', () => {
    expect(recipeStorageId(recipe({ sourceUrl: '', title: 'My Bowl' }))).toBe('tiktok:my bowl');
  });
});
