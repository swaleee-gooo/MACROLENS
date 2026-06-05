import { describe, expect, it } from 'vitest';
import { buildMealFromImportedRecipe, computeRecipeTotals, importedRecipeToMealItems, perServingTotals } from './recipeNutrition';
import type { ImportedRecipe } from './recipeSchema';

function recipe(overrides: Partial<ImportedRecipe> = {}): ImportedRecipe {
  return {
    title: 'Bol de poulet TikTok',
    summary: 'Bol protéiné viral',
    sourceUrl: 'https://vm.tiktok.com/ZGabc/',
    sourcePlatform: 'tiktok',
    sourceAuthor: '@chef',
    imageUrl: 'https://cdn.example/thumb.jpg',
    servings: 2,
    ingredients: [
      { name: 'Blanc de poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      { name: 'Riz cuit', grams: 400, kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
    ],
    steps: ['Cuire le poulet', 'Assembler le bol'],
    ...overrides,
  };
}

describe('computeRecipeTotals', () => {
  it('sums per-100g nutrition across all ingredients for the whole recipe', () => {
    const totals = computeRecipeTotals(recipe().ingredients);
    // chicken: 300g -> 495 kcal, 93 P, 0 C, 10.8 F
    // rice: 400g -> 520 kcal, 10.8 P, 112 C, 1.2 F
    expect(totals).toEqual({ grams: 700, kcal: 1015, proteinG: 103.8, carbsG: 112, fatG: 12 });
  });
});

describe('perServingTotals', () => {
  it('divides totals by servings', () => {
    const totals = computeRecipeTotals(recipe().ingredients);
    expect(perServingTotals(totals, 2)).toEqual({ grams: 350, kcal: 508, proteinG: 51.9, carbsG: 56, fatG: 6 });
  });

  it('treats zero servings as one to avoid division by zero', () => {
    const totals = computeRecipeTotals(recipe().ingredients);
    expect(perServingTotals(totals, 0)).toEqual(totals);
  });
});

describe('importedRecipeToMealItems', () => {
  it('scales each ingredient to a single serving at estimated evidence', () => {
    const items = importedRecipeToMealItems(recipe(), 'meal-1');
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 'meal-1-ingredient-1',
      label: 'Blanc de poulet',
      estimatedGrams: 150,
      evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
    });
    expect(items[0].source.provider).toBe('USER_CUSTOM');
    expect(items[0].source.externalId).toBe('recipe:blanc-de-poulet');
  });
});

describe('buildMealFromImportedRecipe', () => {
  it('builds an estimated, single-serving meal that carries the recipe name and source', () => {
    const meal = buildMealFromImportedRecipe({
      recipe: recipe(),
      userId: 'user-1',
      mealId: 'meal-1',
      capturedAt: '2026-06-05T10:00:00.000Z',
    });

    expect(meal.mealName).toBe('Bol de poulet TikTok');
    expect(meal.imageUri).toBe('https://cdn.example/thumb.jpg');
    expect(meal.userId).toBe('user-1');
    // one serving = half of the 1015 kcal recipe
    expect(meal.caloriesEstimate).toBe(508);
    expect(meal.proteinG).toBeCloseTo(51.9, 1);
    expect(meal.items).toHaveLength(2);
    expect(meal.proof?.status).toBe('estimated');
    expect(meal.proof?.evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
    expect(meal.notes).toContain('@chef');
    expect(meal.notes).toContain('vm.tiktok.com');
  });

  it('falls back to a platform sentinel image when the recipe has no thumbnail', () => {
    const meal = buildMealFromImportedRecipe({
      recipe: recipe({ imageUrl: null }),
      userId: 'user-1',
      mealId: 'meal-2',
      capturedAt: '2026-06-05T10:00:00.000Z',
    });
    expect(meal.imageUri).toBe('recipe://imported/tiktok');
  });
});
