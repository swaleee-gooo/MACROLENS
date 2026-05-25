import { describe, expect, it } from 'vitest';
import { buildGoalProgress } from './goalProgress';
import type { Meal, UserProfile } from './types';

function meal(id: string, capturedAt: string, caloriesEstimate: number): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate,
    caloriesLow: caloriesEstimate - 50,
    caloriesHigh: caloriesEstimate + 50,
    proteinG: 30,
    carbsG: 40,
    fatG: 15,
    fiberG: 5,
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
  weightKg: 80,
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

describe('buildGoalProgress', () => {
  it('builds a data-driven projection from logged calories', () => {
    const progress = buildGoalProgress(
      [meal('deficit-1', '2026-05-24T12:00:00.000Z', 1600), meal('deficit-2', '2026-05-25T12:00:00.000Z', 1600)],
      profile,
      '2026-05-25',
      7,
    );

    expect(progress.points).toHaveLength(7);
    expect(progress.points.at(-1)).toMatchObject({ isoDate: '2026-05-25', logged: true, calories: 1600 });
    expect(progress.currentWeightKg).toBeLessThan(80);
    expect(progress.progressPercent).toBeGreaterThan(0);
    expect(progress.statusLabel).toContain('goal done');
  });

  it('keeps the line flat on days without logs instead of inventing missing calories', () => {
    const progress = buildGoalProgress([], profile, '2026-05-25', 7);

    expect(progress.currentWeightKg).toBe(80);
    expect(progress.points.every((point) => point.logged === false)).toBe(true);
    expect(progress.insight).toBe('Log tes repas pour faire bouger la courbe.');
  });
});
