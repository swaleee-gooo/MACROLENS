import type { Meal } from '../domain/types';
import { createAppMealFromMetaboProofAnalysis } from '../metaboproof/appMealAdapter';
import { analyzeMealEvidence } from '../metaboproof/proofEngine';
import type { MealItem } from '../metaboproof/types';
import type { ImportedRecipe, ImportedRecipeIngredient } from './recipeSchema';

/**
 * Nutrition math + meal construction for imported recipes.
 *
 * The recipe arrives with per-100g nutrition per ingredient and a total gram
 * weight for `servings` portions. Totals are exact arithmetic; the *grams* are
 * AI-estimated from a caption/thumbnail, so the resulting meal is always built at
 * `ESTIMATED_VISUAL_ONLY` evidence (never "verified"). This is what keeps the
 * "Verified vs Estimated" chip honest — the same rule the photo scan obeys.
 */

export type RecipeTotals = {
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

function roundWhole(value: number): number {
  return Math.round(value);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function ingredientNutrition(ingredient: ImportedRecipeIngredient): RecipeTotals {
  const factor = ingredient.grams / 100;
  return {
    grams: ingredient.grams,
    kcal: ingredient.kcalPer100g * factor,
    proteinG: ingredient.proteinPer100g * factor,
    carbsG: ingredient.carbsPer100g * factor,
    fatG: ingredient.fatPer100g * factor,
  };
}

/** Sum nutrition across every ingredient for the whole recipe (all servings). */
export function computeRecipeTotals(ingredients: ImportedRecipeIngredient[]): RecipeTotals {
  const totals = ingredients.reduce<RecipeTotals>(
    (sum, ingredient) => {
      const nutrition = ingredientNutrition(ingredient);
      return {
        grams: sum.grams + nutrition.grams,
        kcal: sum.kcal + nutrition.kcal,
        proteinG: sum.proteinG + nutrition.proteinG,
        carbsG: sum.carbsG + nutrition.carbsG,
        fatG: sum.fatG + nutrition.fatG,
      };
    },
    { grams: 0, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return {
    grams: roundWhole(totals.grams),
    kcal: roundWhole(totals.kcal),
    proteinG: roundMacro(totals.proteinG),
    carbsG: roundMacro(totals.carbsG),
    fatG: roundMacro(totals.fatG),
  };
}

/**
 * When the creator explicitly states the calories per serving in the post, trust
 * that number over the AI's per-ingredient sum (the grams are the least reliable
 * part of the estimate). We anchor the recipe to the stated calories by scaling
 * every ingredient's grams by a single factor, so the per-ingredient breakdown
 * stays internally consistent (sum of items === stated total) and the macros move
 * proportionally. No-op when no number was stated or the computed total is zero.
 */
export function anchorRecipeToStatedCalories(recipe: ImportedRecipe): ImportedRecipe {
  const stated = recipe.statedCaloriesPerServing;
  if (typeof stated !== 'number' || !Number.isFinite(stated) || stated <= 0) {
    return recipe;
  }

  const servings = recipe.servings > 0 ? recipe.servings : 1;
  const computedTotalKcal = computeRecipeTotals(recipe.ingredients).kcal;
  const computedPerServingKcal = computedTotalKcal / servings;
  if (computedPerServingKcal <= 0) {
    return recipe;
  }

  const factor = stated / computedPerServingKcal;
  // Already on target (within rounding) — leave the AI grams untouched.
  if (Math.abs(factor - 1) < 0.01) {
    return recipe;
  }

  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      grams: ingredient.grams * factor,
    })),
  };
}

/** Divide whole-recipe totals by the number of servings (never divide by zero). */
export function perServingTotals(totals: RecipeTotals, servings: number): RecipeTotals {
  const divisor = servings > 0 ? servings : 1;
  return {
    grams: roundWhole(totals.grams / divisor),
    kcal: roundWhole(totals.kcal / divisor),
    proteinG: roundMacro(totals.proteinG / divisor),
    carbsG: roundMacro(totals.carbsG / divisor),
    fatG: roundMacro(totals.fatG / divisor),
  };
}

function isStatedNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** True when the creator stated any per-serving macro or calorie value. */
export function hasStatedMacros(recipe: ImportedRecipe): boolean {
  return (
    isStatedNumber(recipe.statedCaloriesPerServing) ||
    isStatedNumber(recipe.statedProteinPerServing) ||
    isStatedNumber(recipe.statedCarbsPerServing) ||
    isStatedNumber(recipe.statedFatPerServing)
  );
}

/**
 * Overlay creator-stated per-serving values onto a computed serving: each macro the
 * creator wrote wins exactly, the rest fall back to the computed value. Calories use
 * the stated number if given, else are derived from the (stated) macros, else computed.
 */
export function applyStatedMacros(computed: RecipeTotals, recipe: ImportedRecipe): RecipeTotals {
  const proteinG = isStatedNumber(recipe.statedProteinPerServing) ? roundMacro(recipe.statedProteinPerServing) : computed.proteinG;
  const carbsG = isStatedNumber(recipe.statedCarbsPerServing) ? roundMacro(recipe.statedCarbsPerServing) : computed.carbsG;
  const fatG = isStatedNumber(recipe.statedFatPerServing) ? roundMacro(recipe.statedFatPerServing) : computed.fatG;
  const statedMacro =
    isStatedNumber(recipe.statedProteinPerServing) ||
    isStatedNumber(recipe.statedCarbsPerServing) ||
    isStatedNumber(recipe.statedFatPerServing);
  const kcal = isStatedNumber(recipe.statedCaloriesPerServing)
    ? roundWhole(recipe.statedCaloriesPerServing)
    : statedMacro
      ? roundWhole(proteinG * 4 + carbsG * 4 + fatG * 9)
      : computed.kcal;

  return { grams: computed.grams, kcal, proteinG, carbsG, fatG };
}

/** Effective per-serving nutrition for a recipe (creator-stated values win exactly). */
export function recipeServingMacros(recipe: ImportedRecipe): RecipeTotals {
  return applyStatedMacros(perServingTotals(computeRecipeTotals(recipe.ingredients), recipe.servings), recipe);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'ingredient';
}

/**
 * Build MetaboProof meal items for one logged serving of the recipe. Each
 * ingredient's grams are scaled from the whole-recipe weight down to a single
 * serving, then carried as `estimatedGrams` at estimated evidence.
 */
export function importedRecipeToMealItems(recipe: ImportedRecipe, mealId: string): MealItem[] {
  const servings = recipe.servings > 0 ? recipe.servings : 1;

  return recipe.ingredients.map((ingredient, index) => ({
    id: `${mealId}-ingredient-${index + 1}`,
    label: ingredient.name,
    estimatedGrams: ingredient.grams / servings,
    confidence: 0.6,
    evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
    source: {
      provider: 'USER_CUSTOM',
      externalId: `recipe:${slugify(ingredient.name)}`,
      name: ingredient.name,
      kcalPer100g: ingredient.kcalPer100g,
      proteinPer100g: ingredient.proteinPer100g,
      carbsPer100g: ingredient.carbsPer100g,
      fatPer100g: ingredient.fatPer100g,
    },
  }));
}

/**
 * Convert an imported recipe into an app `Meal` representing one serving, ready
 * to flow through the existing Result → Save pipeline. Re-uses the same
 * MetaboProof adapter as the weighed-recipe and calibration flows.
 */
export function buildMealFromImportedRecipe({
  recipe,
  userId,
  mealId,
  capturedAt,
}: {
  recipe: ImportedRecipe;
  userId: string;
  mealId: string;
  capturedAt: string;
}): Meal {
  const items = importedRecipeToMealItems(recipe, mealId);
  const analysis = analyzeMealEvidence({ id: mealId, items });
  const meal = createAppMealFromMetaboProofAnalysis({
    userId,
    mealName: recipe.title,
    imageUri: recipe.imageUrl ?? `recipe://imported/${recipe.sourcePlatform}`,
    capturedAt,
    analysis,
  });

  const sourceLabel = recipe.sourceAuthor ? `${recipe.sourceAuthor} · ${recipe.sourceUrl}` : recipe.sourceUrl;
  const notes = `Imported recipe from ${sourceLabel}`.trim();

  // When the creator stated macros/calories, those exact numbers win over the
  // per-ingredient computation — that is what the user saw in the video.
  if (!hasStatedMacros(recipe)) {
    return { ...meal, notes };
  }

  const stated = recipeServingMacros(recipe);
  return {
    ...meal,
    caloriesEstimate: stated.kcal,
    caloriesLow: stated.kcal,
    caloriesHigh: stated.kcal,
    proteinG: stated.proteinG,
    carbsG: stated.carbsG,
    fatG: stated.fatG,
    proof: meal.proof ? { ...meal.proof, kcalRange: { min: stated.kcal, max: stated.kcal } } : meal.proof,
    notes,
  };
}
