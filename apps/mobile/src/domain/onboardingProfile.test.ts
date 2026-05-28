import { describe, expect, it } from 'vitest';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid } from './onboardingProfile';

describe('onboarding profile', () => {
  it('validates complete realistic onboarding data', () => {
    expect(
      isOnboardingDraftValid({
        goal: 'lose_fat',
        age: 28,
        sex: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevel: 'moderate',
      }),
    ).toBe(true);
  });

  it('rejects unrealistic values', () => {
    expect(
      isOnboardingDraftValid({
        goal: 'lose_fat',
        age: 12,
        sex: 'male',
        heightCm: 80,
        weightKg: 20,
        activityLevel: 'moderate',
      }),
    ).toBe(false);
  });

  it('builds a user profile with calculated targets', () => {
    const profile = buildUserProfileFromOnboarding(
      {
        goal: 'lose_fat',
        age: 28,
        sex: 'male',
        heightCm: 180,
        weightKg: 80,
        activityLevel: 'moderate',
      },
      'local-user',
      '2026-05-24T10:00:00.000Z',
    );

    expect(profile.id).toBe('local-user');
    expect(profile.ageRange).toBe('25-34');
    expect(profile.targets.calorieTarget).toBeGreaterThan(0);
    expect(profile.targets.proteinTargetG).toBe(160);
    expect(profile.updatedAt).toBe('2026-05-24T10:00:00.000Z');
  });

  it('persists the selected target weight from activation onboarding', () => {
    const profile = buildUserProfileFromOnboarding(
      {
        goal: 'lose_fat',
        age: 28,
        sex: 'male',
        heightCm: 180,
        weightKg: 80,
        targetWeightKg: 72,
        weeklyPaceKg: 0.5,
        activityLevel: 'moderate',
      },
      'local-user',
      '2026-05-24T10:00:00.000Z',
    );

    expect(profile.targetWeightKg).toBe(72);
  });

  it('rejects a target weight outside a realistic range when provided', () => {
    expect(
      isOnboardingDraftValid({
        goal: 'lose_fat',
        age: 28,
        sex: 'male',
        heightCm: 180,
        weightKg: 80,
        targetWeightKg: 20,
        weeklyPaceKg: 0.5,
        activityLevel: 'moderate',
      }),
    ).toBe(false);
  });
});
