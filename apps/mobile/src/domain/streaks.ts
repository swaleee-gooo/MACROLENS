import type { Meal } from './types';

function previousIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function calculateMealStreak(meals: Meal[], todayIsoDate: string): number {
  const daysWithMeals = new Set(meals.map((meal) => meal.capturedAt.slice(0, 10)));
  let cursor = todayIsoDate;
  let streak = 0;

  while (daysWithMeals.has(cursor)) {
    streak += 1;
    cursor = previousIsoDate(cursor);
  }

  return streak;
}
