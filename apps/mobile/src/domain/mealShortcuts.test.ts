import { describe, expect, it } from 'vitest';
import { buildMealShortcuts } from './mealShortcuts';
import type { Meal } from './types';

function meal(id: string, name: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://test',
    capturedAt,
    mealName: name,
    caloriesEstimate: 500,
    caloriesLow: 450,
    caloriesHigh: 550,
    proteinG: 35,
    carbsG: 50,
    fatG: 18,
    fiberG: 6,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildMealShortcuts', () => {
  it('prioritizes recent recurring meals', () => {
    const shortcuts = buildMealShortcuts([
      meal('1', 'Bowl proteine', '2026-05-25T12:00:00.000Z'),
      meal('2', 'Bowl proteine', '2026-05-24T12:00:00.000Z'),
      meal('3', 'Omelette', '2026-05-23T08:00:00.000Z'),
    ]);

    expect(shortcuts[0].label).toBe('Bowl proteine');
    expect(shortcuts[0].count).toBe(2);
  });
});
