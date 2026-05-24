import { describe, expect, it } from 'vitest';
import { calculateMealStreak } from './streaks';
import type { Meal } from './types';

function meal(id: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: 500,
    caloriesLow: 425,
    caloriesHigh: 575,
    proteinG: 30,
    carbsG: 50,
    fatG: 15,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('calculateMealStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(
      calculateMealStreak(
        [
          meal('today', '2026-05-24T10:00:00.000Z'),
          meal('yesterday', '2026-05-23T10:00:00.000Z'),
          meal('two-days', '2026-05-22T10:00:00.000Z'),
        ],
        '2026-05-24',
      ),
    ).toBe(3);
  });

  it('returns zero when today has no meal', () => {
    expect(calculateMealStreak([meal('yesterday', '2026-05-23T10:00:00.000Z')], '2026-05-24')).toBe(0);
  });
});
