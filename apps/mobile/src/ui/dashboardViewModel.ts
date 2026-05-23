import { roundMacro } from '../domain/nutrition';
import type { ConfidenceTier, Meal } from '../domain/types';

export type DailySummary = {
  mealCount: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export function buildDailySummary(meals: Meal[], isoDate: string): DailySummary {
  const mealsForDate = meals.filter((meal) => meal.capturedAt.startsWith(isoDate));

  return {
    mealCount: mealsForDate.length,
    calories: Math.round(mealsForDate.reduce((sum, meal) => sum + meal.caloriesEstimate, 0)),
    proteinG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.proteinG, 0)),
    carbsG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.carbsG, 0)),
    fatG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.fatG, 0)),
    fiberG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.fiberG, 0)),
  };
}

export function formatConfidenceLabel(confidence: ConfidenceTier): string {
  if (confidence === 'high') {
    return 'Fiabilite elevee';
  }

  if (confidence === 'medium') {
    return 'Fiabilite moyenne';
  }

  return 'A verifier';
}
