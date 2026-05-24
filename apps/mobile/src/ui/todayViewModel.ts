import type { MacroTargets, Meal } from '../domain/types';
import { buildDailySummary } from './dashboardViewModel';

function progressPercent(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(999, Math.round((value / target) * 100));
}

export function buildTodayViewModel(meals: Meal[], isoDate: string, targets: MacroTargets | null) {
  const mealsForDate = meals.filter((meal) => meal.capturedAt.startsWith(isoDate));
  const summary = buildDailySummary(meals, isoDate, targets);

  return {
    meals: mealsForDate,
    summary,
    calorieProgress: targets ? progressPercent(summary.calories, targets.calorieTarget) : null,
    proteinProgress: targets ? progressPercent(summary.proteinG, targets.proteinTargetG) : null,
  };
}
