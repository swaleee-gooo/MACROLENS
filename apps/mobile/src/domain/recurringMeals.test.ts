import { describe, expect, it } from 'vitest';
import { buildRecurringMealSuggestions, cloneMealForRelog } from './recurringMeals';
import type { Meal } from './types';

function meal(id: string, mealName: string, capturedAt: string, calories = 500, proteinG = 35): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName,
    caloriesEstimate: calories,
    caloriesLow: calories - 50,
    caloriesHigh: calories + 50,
    proteinG,
    carbsG: 45,
    fatG: 14,
    fiberG: 6,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [
      {
        id: `${id}-item-1`,
        mealId: id,
        name: mealName,
        canonicalFoodName: mealName.toLowerCase(),
        estimatedQuantity: 250,
        unit: 'g',
        calories,
        proteinG,
        carbsG: 45,
        fatG: 14,
        fiberG: 6,
        confidence: 'medium',
        dataSource: 'estimated',
        sourceFoodId: null,
      },
    ],
  };
}

describe('buildRecurringMealSuggestions', () => {
  it('groups meals by normalized name and keeps the most recent meal as template', () => {
    const suggestions = buildRecurringMealSuggestions([
      meal('old', 'Bowl Proteine', '2026-05-20T12:00:00.000Z', 520, 40),
      meal('new', ' bowl proteine ', '2026-05-24T12:00:00.000Z', 610, 48),
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].count).toBe(2);
    expect(suggestions[0].mealName).toBe('bowl proteine');
    expect(suggestions[0].templateMeal.id).toBe('new');
    expect(suggestions[0].calories).toBe(610);
  });

  it('sorts by frequency first, then recency', () => {
    const suggestions = buildRecurringMealSuggestions([
      meal('recent-once', 'Skyr', '2026-05-24T08:00:00.000Z'),
      meal('older-a', 'Poulet riz', '2026-05-20T12:00:00.000Z'),
      meal('older-b', 'Poulet riz', '2026-05-21T12:00:00.000Z'),
    ]);

    expect(suggestions.map((suggestion) => suggestion.mealName)).toEqual(['Poulet riz', 'Skyr']);
  });
});

describe('cloneMealForRelog', () => {
  it('creates a fresh meal id, timestamp, and item ids', () => {
    const original = meal('meal-1', 'Poulet riz', '2026-05-20T12:00:00.000Z');
    const cloned = cloneMealForRelog(original, '2026-05-25T19:00:00.000Z', 'fixed');

    expect(cloned.id).toBe('relog-meal-1-fixed');
    expect(cloned.capturedAt).toBe('2026-05-25T19:00:00.000Z');
    expect(cloned.items[0].mealId).toBe(cloned.id);
    expect(cloned.items[0].id).toBe('relog-meal-1-fixed-item-1');
    expect(cloned.caloriesEstimate).toBe(original.caloriesEstimate);
  });
});
