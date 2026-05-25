import type { Meal } from '../domain/types';

export type GoalRange = '90d' | '6m' | '1y' | 'all';

export const goalRanges: { value: GoalRange; label: string }[] = [
  { value: '90d', label: '90 j' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

function daysBetween(startIsoDate: string, endIsoDate: string): number {
  const start = new Date(`${startIsoDate}T12:00:00.000Z`).getTime();
  const end = new Date(`${endIsoDate}T12:00:00.000Z`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function goalRangeDays(range: GoalRange, meals: Meal[], todayIsoDate: string): number {
  if (range === '6m') {
    return 183;
  }

  if (range === '1y') {
    return 365;
  }

  if (range === 'all') {
    const oldestMeal = meals.length > 0 ? meals[meals.length - 1] : undefined;
    return oldestMeal ? Math.max(90, daysBetween(oldestMeal.capturedAt.slice(0, 10), todayIsoDate)) : 90;
  }

  return 90;
}
