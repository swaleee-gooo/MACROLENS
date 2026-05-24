import { roundMacro } from '../domain/nutrition';
import type { ConfidenceTier, MacroTargets, Meal } from '../domain/types';

export type DailySummary = {
  mealCount: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  calorieTarget: number | null;
  proteinTargetG: number | null;
  calorieProgress: number | null;
  proteinProgress: number | null;
};

function progressPercent(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(999, Math.round((value / target) * 100));
}

export function buildDailySummary(meals: Meal[], isoDate: string, targets: MacroTargets | null = null): DailySummary {
  const mealsForDate = meals.filter((meal) => meal.capturedAt.startsWith(isoDate));
  const calories = Math.round(mealsForDate.reduce((sum, meal) => sum + meal.caloriesEstimate, 0));
  const proteinG = roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.proteinG, 0));
  const carbsG = roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.carbsG, 0));
  const fatG = roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.fatG, 0));
  const fiberG = roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.fiberG, 0));

  return {
    mealCount: mealsForDate.length,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    calorieTarget: targets?.calorieTarget ?? null,
    proteinTargetG: targets?.proteinTargetG ?? null,
    calorieProgress: targets ? progressPercent(calories, targets.calorieTarget) : null,
    proteinProgress: targets ? progressPercent(proteinG, targets.proteinTargetG) : null,
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
