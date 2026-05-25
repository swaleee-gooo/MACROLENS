import { describe, expect, it } from 'vitest';
import { goalRangeDays, goalRanges } from './goalProgressRanges';
import type { Meal } from '../domain/types';

function meal(id: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: 400,
    caloriesLow: 350,
    caloriesHigh: 450,
    proteinG: 30,
    carbsG: 30,
    fatG: 12,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('goalProgressRanges', () => {
  it('keeps the commercial range order', () => {
    expect(goalRanges.map((range) => range.label)).toEqual(['90 j', '6 mois', '1 an', 'Tout']);
  });

  it('returns fixed day windows for standard ranges', () => {
    expect(goalRangeDays('90d', [], '2026-05-25')).toBe(90);
    expect(goalRangeDays('6m', [], '2026-05-25')).toBe(183);
    expect(goalRangeDays('1y', [], '2026-05-25')).toBe(365);
  });

  it('uses the oldest meal for all time while keeping at least 90 days', () => {
    const meals = [meal('new', '2026-05-24T10:00:00.000Z'), meal('old', '2026-01-01T10:00:00.000Z')];

    expect(goalRangeDays('all', meals, '2026-05-25')).toBe(145);
  });
});
