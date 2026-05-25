import type { Meal } from './types';

export type RecurringMealSuggestion = {
  id: string;
  mealName: string;
  count: number;
  lastLoggedAt: string;
  lastLoggedLabel: string;
  calories: number;
  proteinG: number;
  templateMeal: Meal;
};

function normalizedMealName(mealName: string): string {
  return mealName.trim().replace(/\s+/g, ' ').toLowerCase();
}

function displayMealName(mealName: string): string {
  return mealName.trim().replace(/\s+/g, ' ');
}

function lastLoggedLabel(capturedAt: string): string {
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Recemment';
  }

  return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
}

export function buildRecurringMealSuggestions(meals: Meal[], limit = 4): RecurringMealSuggestion[] {
  const groups = new Map<string, Meal[]>();

  for (const meal of meals) {
    const key = normalizedMealName(meal.mealName);
    if (!key) {
      continue;
    }

    groups.set(key, [...(groups.get(key) ?? []), meal]);
  }

  return Array.from(groups.entries())
    .map(([key, groupMeals]) => {
      const sorted = [...groupMeals].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      const templateMeal = sorted[0];

      return {
        id: key,
        mealName: displayMealName(templateMeal.mealName),
        count: groupMeals.length,
        lastLoggedAt: templateMeal.capturedAt,
        lastLoggedLabel: lastLoggedLabel(templateMeal.capturedAt),
        calories: templateMeal.caloriesEstimate,
        proteinG: templateMeal.proteinG,
        templateMeal,
      };
    })
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return b.lastLoggedAt.localeCompare(a.lastLoggedAt);
    })
    .slice(0, limit);
}

export function cloneMealForRelog(meal: Meal, capturedAt: string = new Date().toISOString(), idSuffix = `${Date.now()}`): Meal {
  const nextMealId = `relog-${meal.id}-${idSuffix}`;

  return {
    ...meal,
    id: nextMealId,
    capturedAt,
    items: meal.items.map((item, index) => ({
      ...item,
      id: `${nextMealId}-item-${index + 1}`,
      mealId: nextMealId,
    })),
  };
}
