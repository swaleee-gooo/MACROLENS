import type { Meal, UserProfile } from './types';

export type ProgressMetrics = {
  averageCalories7d: number;
  averageProtein7d: number;
  loggedDays7d: number;
  calorieAdherencePercent: number;
  proteinAdherencePercent: number;
};

function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function percent(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(999, Math.round((value / target) * 100)));
}

export function buildProgressMetrics(meals: Meal[], profile: UserProfile, todayIsoDate: string): ProgressMetrics {
  const allowedDates = new Set(Array.from({ length: 7 }, (_, index) => shiftIsoDate(todayIsoDate, -index)));
  const meals7d = meals.filter((meal) => allowedDates.has(meal.capturedAt.slice(0, 10)));
  const loggedDays7d = new Set(meals7d.map((meal) => meal.capturedAt.slice(0, 10))).size;
  const totalCalories = meals7d.reduce((sum, meal) => sum + meal.caloriesEstimate, 0);
  const totalProtein = meals7d.reduce((sum, meal) => sum + meal.proteinG, 0);
  const averageCalories7d = loggedDays7d > 0 ? Math.round(totalCalories / loggedDays7d) : 0;
  const averageProtein7d = loggedDays7d > 0 ? Math.round(totalProtein / loggedDays7d) : 0;

  return {
    averageCalories7d,
    averageProtein7d,
    loggedDays7d,
    calorieAdherencePercent: percent(averageCalories7d, profile.targets.calorieTarget),
    proteinAdherencePercent: percent(averageProtein7d, profile.targets.proteinTargetG),
  };
}
