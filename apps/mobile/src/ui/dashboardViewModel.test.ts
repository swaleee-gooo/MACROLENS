import { describe, expect, it } from 'vitest';
import { buildDailySummary, formatConfidenceLabel } from './dashboardViewModel';
import type { Meal } from '../domain/types';

const meals: Meal[] = [
  {
    id: 'meal-1',
    userId: 'local-user',
    imageUri: 'file://meal.jpg',
    capturedAt: '2026-05-23T12:30:00.000Z',
    mealName: 'Poulet, riz et legumes',
    caloriesEstimate: 506,
    caloriesLow: 430,
    caloriesHigh: 582,
    proteinG: 51,
    carbsG: 57.3,
    fatG: 6.1,
    fiberG: 4.6,
    confidence: 'medium',
    notes: '',
    source: 'mock',
    items: [],
  },
];

describe('dashboard view model', () => {
  it('builds a daily summary for the selected date', () => {
    expect(buildDailySummary(meals, '2026-05-23')).toEqual({
      mealCount: 1,
      calories: 506,
      proteinG: 51,
      carbsG: 57.3,
      fatG: 6.1,
      fiberG: 4.6,
    });
  });

  it('formats confidence labels in French', () => {
    expect(formatConfidenceLabel('high')).toBe('Fiabilite elevee');
    expect(formatConfidenceLabel('medium')).toBe('Fiabilite moyenne');
    expect(formatConfidenceLabel('low')).toBe('A verifier');
  });
});
