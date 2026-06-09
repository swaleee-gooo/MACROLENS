import { calculateMealStreak } from '../domain/streaks';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import { recipeServingMacros } from '../recipeImport/recipeNutrition';
import type { ImportedRecipe } from '../recipeImport/recipeSchema';

/**
 * Pure content/logic for the shareable branded cards (viral acquisition).
 * The visual lives in `ShareCard.tsx`; capture-to-image + native sharing are added
 * by the native build (react-native-view-shot + react-native-share). English copy:
 * these are US-market growth assets, independent of the in-app language.
 */

// Real App Store listing (ascAppId 6774111134, from eas.json submit config).
export const MACROLENS_APP_STORE_URL = 'https://apps.apple.com/app/id6774111134';

export type ShareCardKind = 'recipe' | 'meal' | 'progress';

export type ShareCardMacros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type ShareCardData = {
  kind: ShareCardKind;
  eyebrow: string;
  title: string;
  calories: number;
  macros: ShareCardMacros;
  /** Real product/dish photo when available; the card falls back to a gradient. */
  imageUrl: string | null;
  progress?: {
    streakDays: number;
    weightKg: number | null;
    calorieProgressPct: number;
    proteinProgressPct: number;
  };
};

type MealWithThumbnail = Meal & { thumbnailUrl?: string | null };

function usableImageUri(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return /^(https?:\/\/|file:\/\/|content:\/\/)/i.test(value) ? value : null;
}

function httpImage(meal: Meal): string | null {
  const thumbnailUrl = (meal as MealWithThumbnail).thumbnailUrl;
  const thumbnail = usableImageUri(thumbnailUrl);
  if (thumbnail) {
    return thumbnail;
  }

  return usableImageUri(meal.imageUri);
}

/** Build card data from a saved meal — works for imported recipes, own recipes, and scans. */
export function cardDataFromMeal(meal: Meal, kind: 'recipe' | 'meal' = 'meal'): ShareCardData {
  return {
    kind,
    eyebrow: kind === 'recipe' ? 'Recipe - 1 serving' : "Today's meal",
    title: meal.mealName,
    calories: Math.round(meal.caloriesEstimate),
    macros: { proteinG: meal.proteinG, carbsG: meal.carbsG, fatG: meal.fatG },
    imageUrl: httpImage(meal),
  };
}

export function cardDataFromImportedRecipe(recipe: ImportedRecipe): ShareCardData {
  const serving = recipeServingMacros(recipe);

  return {
    kind: 'recipe',
    eyebrow: `Recipe - ${Math.max(1, recipe.servings)} serving${recipe.servings === 1 ? '' : 's'}`,
    title: recipe.title,
    calories: serving.kcal,
    macros: {
      proteinG: serving.proteinG,
      carbsG: serving.carbsG,
      fatG: serving.fatG,
    },
    imageUrl: usableImageUri(recipe.imageUrl),
  };
}

function mealIsoDate(meal: Meal): string {
  return meal.capturedAt.slice(0, 10);
}

function progressPercent(value: number, target: number | null | undefined): number {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export function cardDataFromProgress({
  meals,
  targets,
  profile,
  isoDate = new Date().toISOString().slice(0, 10),
}: {
  meals: Meal[];
  targets: MacroTargets | null;
  profile: UserProfile | null;
  isoDate?: string;
}): ShareCardData {
  const dayMeals = meals.filter((meal) => mealIsoDate(meal) === isoDate);
  const calories = dayMeals.reduce((sum, meal) => sum + meal.caloriesEstimate, 0);
  const proteinG = dayMeals.reduce((sum, meal) => sum + meal.proteinG, 0);
  const carbsG = dayMeals.reduce((sum, meal) => sum + meal.carbsG, 0);
  const fatG = dayMeals.reduce((sum, meal) => sum + meal.fatG, 0);
  const streakDays = calculateMealStreak(meals, isoDate);

  return {
    kind: 'progress',
    eyebrow: 'Progress update',
    title: streakDays > 0 ? `${streakDays}-day tracking streak` : "Today's macro check-in",
    calories: Math.round(calories),
    macros: { proteinG, carbsG, fatG },
    imageUrl: null,
    progress: {
      streakDays,
      weightKg: profile?.weightKg ?? null,
      calorieProgressPct: progressPercent(calories, targets?.calorieTarget),
      proteinProgressPct: progressPercent(proteinG, targets?.proteinTargetG),
    },
  };
}

/** kcal-weighted macro split for the tri-segment bar (always sums to 100). */
export function macroBarSegments(macros: ShareCardMacros): { proteinPct: number; carbsPct: number; fatPct: number } {
  const protein = Math.max(0, macros.proteinG) * 4;
  const carbs = Math.max(0, macros.carbsG) * 4;
  const fat = Math.max(0, macros.fatG) * 9;
  const total = protein + carbs + fat || 1;

  return {
    proteinPct: (protein / total) * 100,
    carbsPct: (carbs / total) * 100,
    fatPct: (fat / total) * 100,
  };
}

/** English caption shared alongside the image (links back to the App Store). */
export function buildShareCaption(kind: ShareCardKind, title?: string): string {
  const cleanTitle = title?.trim();

  if (kind === 'recipe') {
    return `${cleanTitle ? `${cleanTitle} — ` : ''}full recipe + macros, scanned in seconds 🍱\nMade with MacroLens → ${MACROLENS_APP_STORE_URL}`;
  }

  if (kind === 'progress') {
    return `Tracking my macros with MacroLens 🔥 Calories + macros in one tap.\nGet it → ${MACROLENS_APP_STORE_URL}`;
  }

  return `Calories + macros from a photo, in one tap 📸\nMade with MacroLens → ${MACROLENS_APP_STORE_URL}`;
}
