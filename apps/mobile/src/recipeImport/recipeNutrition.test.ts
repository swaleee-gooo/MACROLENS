import { describe, expect, it } from 'vitest';
import {
  anchorRecipeToStatedCalories,
  buildMealFromImportedRecipe,
  computeRecipeTotals,
  importedRecipeToMealItems,
  perServingTotals,
  recipeServingMacros,
} from './recipeNutrition';
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
    statedCaloriesPerServing: null,
    statedProteinPerServing: null,
    statedCarbsPerServing: null,
    statedFatPerServing: null,
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

describe('anchorRecipeToStatedCalories', () => {
  it('scales ingredient grams so per-serving kcal matches the creator-stated value', () => {
    // computed: 1015 kcal whole / 2 servings = 507.5 per serving; creator stated 400.
    const anchored = anchorRecipeToStatedCalories(recipe({ statedCaloriesPerServing: 400 }));
    const perServing = perServingTotals(computeRecipeTotals(anchored.ingredients), anchored.servings);
    expect(perServing.kcal).toBe(400);
    expect(anchored.ingredients[0].grams).toBeCloseTo(300 * (400 / 507.5), 2);
    expect(anchored.ingredients[1].grams).toBeCloseTo(400 * (400 / 507.5), 2);
  });

  it('is a no-op when the post states no calories', () => {
    const base = recipe({ statedCaloriesPerServing: null });
    expect(anchorRecipeToStatedCalories(base)).toBe(base);
  });

  it('leaves grams untouched when the AI estimate already matches the stated value', () => {
    const base = recipe({ statedCaloriesPerServing: 508 });
    expect(anchorRecipeToStatedCalories(base)).toBe(base);
  });

  it('ignores a non-positive stated value', () => {
    const base = recipe({ statedCaloriesPerServing: 0 });
    expect(anchorRecipeToStatedCalories(base)).toBe(base);
  });
});

describe('recipeServingMacros', () => {
  it('uses the creator-stated macros exactly, not the computed ones', () => {
    const macros = recipeServingMacros(
      recipe({ statedCaloriesPerServing: 508, statedProteinPerServing: 52, statedCarbsPerServing: 56, statedFatPerServing: 6 }),
    );
    expect(macros).toMatchObject({ kcal: 508, proteinG: 52, carbsG: 56, fatG: 6 });
  });

  it('overrides only the stated fields and computes the rest', () => {
    // Only protein is stated → protein is exact, carbs/fat stay computed (per serving).
    const macros = recipeServingMacros(recipe({ statedProteinPerServing: 80 }));
    expect(macros.proteinG).toBe(80);
    expect(macros.carbsG).toBeCloseTo(56, 1);
    expect(macros.fatG).toBeCloseTo(6, 1);
  });

  it('derives calories from stated macros when only macros are given', () => {
    const macros = recipeServingMacros(recipe({ statedProteinPerServing: 50, statedCarbsPerServing: 50, statedFatPerServing: 10 }));
    // 50*4 + 50*4 + 10*9 = 490
    expect(macros.kcal).toBe(490);
  });

  it('falls back to the computed serving when nothing is stated', () => {
    expect(recipeServingMacros(recipe())).toEqual(perServingTotals(computeRecipeTotals(recipe().ingredients), 2));
  });
});

describe('buildMealFromImportedRecipe with stated macros', () => {
  it('locks the meal totals to the creator-stated values', () => {
    const meal = buildMealFromImportedRecipe({
      recipe: recipe({ statedCaloriesPerServing: 420, statedProteinPerServing: 40, statedCarbsPerServing: 45, statedFatPerServing: 9 }),
      userId: 'user-1',
      mealId: 'meal-stated',
      capturedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(meal.caloriesEstimate).toBe(420);
    expect(meal.proteinG).toBe(40);
    expect(meal.carbsG).toBe(45);
    expect(meal.fatG).toBe(9);
    expect(meal.caloriesLow).toBe(420);
    expect(meal.caloriesHigh).toBe(420);
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
