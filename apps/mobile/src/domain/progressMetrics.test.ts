import { describe, expect, it } from 'vitest';
import { buildProgressMetrics } from './progressMetrics';
import type { Meal, UserProfile } from './types';

function meal(id: string, date: string, calories: number, proteinG: number): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://test',
    capturedAt: `${date}T12:00:00.000Z`,
    mealName: id,
    caloriesEstimate: calories,
    caloriesLow: calories,
    caloriesHigh: calories,
    proteinG,
    carbsG: 80,
    fatG: 20,
    fiberG: 8,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

const profile: UserProfile = {
  id: 'local-user',
  goal: 'lose_fat',
  ageRange: '25-34',
  sex: 'female',
  heightCm: 170,
  weightKg: 79.5,
  activityLevel: 'moderate',
  targetWeightKg: 75,
  targets: {
    calorieTarget: 2000,
    proteinTargetG: 140,
    carbsTargetG: 220,
    fatTargetG: 65,
    fiberTargetG: 30,
    calorieOverride: null,
    proteinOverrideG: null,
  },
  updatedAt: '2026-05-25T12:00:00.000Z',
};

describe('buildProgressMetrics', () => {
  it('summarizes 7 day averages and target adherence', () => {
    const metrics = buildProgressMetrics(
      [meal('a', '2026-05-25', 1800, 130), meal('b', '2026-05-24', 2200, 150), meal('old', '2026-05-12', 3000, 30)],
      profile,
      '2026-05-25',
    );

    expect(metrics.averageCalories7d).toBe(2000);
    expect(metrics.averageProtein7d).toBe(140);
    expect(metrics.loggedDays7d).toBe(2);
    expect(metrics.calorieAdherencePercent).toBe(100);
    expect(metrics.proteinAdherencePercent).toBe(100);
  });

  it('returns zeroed metrics when there are no logged days', () => {
    const metrics = buildProgressMetrics([], profile, '2026-05-25');

    expect(metrics.averageCalories7d).toBe(0);
    expect(metrics.averageProtein7d).toBe(0);
    expect(metrics.loggedDays7d).toBe(0);
    expect(metrics.calorieAdherencePercent).toBe(0);
    expect(metrics.proteinAdherencePercent).toBe(0);
  });
});
