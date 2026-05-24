import { describe, expect, it } from 'vitest';
import { calculateMacroTargets } from './macroTargets';
import type { UserProfile } from './types';

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'local-user',
    goal: 'maintain',
    ageRange: '25-34',
    sex: 'male',
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'moderate',
    targetWeightKg: null,
    targets: {
      calorieTarget: 0,
      proteinTargetG: 0,
      carbsTargetG: 0,
      fatTargetG: 0,
      fiberTargetG: 0,
      calorieOverride: null,
      proteinOverrideG: null,
    },
    updatedAt: '2026-05-24T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculateMacroTargets', () => {
  it('creates a modest deficit and high protein target for fat loss', () => {
    const targets = calculateMacroTargets(profile({ goal: 'lose_fat' }));

    expect(targets.calorieTarget).toBeGreaterThanOrEqual(2100);
    expect(targets.calorieTarget).toBeLessThanOrEqual(2400);
    expect(targets.proteinTargetG).toBe(160);
    expect(targets.fatTargetG).toBeGreaterThanOrEqual(60);
    expect(targets.carbsTargetG).toBeGreaterThan(100);
    expect(targets.fiberTargetG).toBe(30);
  });

  it('creates a modest surplus for muscle gain', () => {
    const maintain = calculateMacroTargets(profile({ goal: 'maintain' }));
    const build = calculateMacroTargets(profile({ goal: 'build_muscle' }));

    expect(build.calorieTarget).toBeGreaterThan(maintain.calorieTarget);
    expect(build.proteinTargetG).toBe(160);
  });

  it('keeps maintain and understand eating close to TDEE', () => {
    const maintain = calculateMacroTargets(profile({ goal: 'maintain' }));
    const understand = calculateMacroTargets(profile({ goal: 'understand_eating' }));

    expect(Math.abs(maintain.calorieTarget - understand.calorieTarget)).toBeLessThanOrEqual(100);
    expect(maintain.proteinTargetG).toBe(128);
    expect(understand.proteinTargetG).toBe(128);
  });

  it('uses calorie and protein overrides when present', () => {
    const targets = calculateMacroTargets(
      profile({
        targets: {
          calorieTarget: 0,
          proteinTargetG: 0,
          carbsTargetG: 0,
          fatTargetG: 0,
          fiberTargetG: 0,
          calorieOverride: 1900,
          proteinOverrideG: 145,
        },
      }),
    );

    expect(targets.calorieTarget).toBe(1900);
    expect(targets.proteinTargetG).toBe(145);
  });
});
