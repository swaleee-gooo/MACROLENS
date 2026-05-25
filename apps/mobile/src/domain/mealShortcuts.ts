import type { Meal } from './types';

export type MealShortcut = {
  label: string;
  count: number;
  latestMeal: Meal;
};

function normalize(mealName: string): string {
  return mealName.trim().replace(/\s+/g, ' ').toLowerCase();
}

function displayMealName(mealName: string): string {
  return mealName.trim().replace(/\s+/g, ' ');
}

export function buildMealShortcuts(meals: Meal[], limit = 5): MealShortcut[] {
  const groups = new Map<string, Meal[]>();

  for (const meal of meals) {
    const key = normalize(meal.mealName);
    if (!key) {
      continue;
    }

    groups.set(key, [...(groups.get(key) ?? []), meal]);
  }

  return Array.from(groups.values())
    .map((group) => {
      const sorted = [...group].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      const latestMeal = sorted[0];

      return {
        label: displayMealName(latestMeal.mealName),
        count: group.length,
        latestMeal,
      };
    })
    .sort((a, b) => b.count - a.count || b.latestMeal.capturedAt.localeCompare(a.latestMeal.capturedAt))
    .slice(0, limit);
}
