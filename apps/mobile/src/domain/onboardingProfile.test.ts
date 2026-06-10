import { describe, expect, it } from 'vitest';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid } from './onboardingProfile';
import { ftInToCm, kgToLbs, lbsToKg } from './units';

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

describe('onboarding profile from imperial input (S2)', () => {
  // What the imperial onboarding fields produce: 5 ft 9 in, 165 lbs current,
  // 145 lbs target, "1 lb/week" pace chip (underlying value stays 0.5 kg).
  const imperialDraft = {
    goal: 'lose_fat' as const,
    age: 28,
    sex: 'male' as const,
    heightCm: ftInToCm(5, 9),
    weightKg: lbsToKg(165),
    targetWeightKg: lbsToKg(145),
    weeklyPaceKg: 0.5,
    activityLevel: 'moderate' as const,
  };

  it('stores the expected canonical metric values (5\'9" → 175.26 cm, 165 lbs → 74.84 kg)', () => {
    const profile = buildUserProfileFromOnboarding(imperialDraft, 'local-user', '2026-06-10T10:00:00.000Z');

    expect(profile.heightCm).toBeCloseTo(175.26, 10);
    expect(profile.weightKg).toBeCloseTo(74.84274105, 6);
    expect(profile.targetWeightKg).toBeCloseTo(65.77089365, 6);
    expect(isOnboardingDraftValid(imperialDraft)).toBe(true);
  });

  it('matches the targets of the profile built from the equivalent metric draft', () => {
    const fromImperial = buildUserProfileFromOnboarding(imperialDraft, 'local-user', '2026-06-10T10:00:00.000Z');
    // Known metric equivalents of 5'9" / 165 lbs / 145 lbs, written as literals
    // so this check is independent of units.ts.
    const fromMetric = buildUserProfileFromOnboarding(
      { ...imperialDraft, heightCm: 175.26, weightKg: 74.84274105, targetWeightKg: 65.77089365 },
      'local-user',
      '2026-06-10T10:00:00.000Z',
    );

    expect(fromImperial.targets).toEqual(fromMetric.targets);
    expect(fromImperial.ageRange).toBe(fromMetric.ageRange);
    expect(fromImperial.targets.calorieTarget).toBeGreaterThan(0);
  });

  it('keeps weightKg identical when the untouched lbs value is re-saved (round-trip)', () => {
    const profile = buildUserProfileFromOnboarding(imperialDraft, 'local-user', '2026-06-10T10:00:00.000Z');
    // Reopen: the edit screen renders the stored kg as lbs...
    const redisplayedLbs = kgToLbs(profile.weightKg);
    expect(redisplayedLbs).toBe(165);
    // ...and re-saving without touching the field stores the exact same kg.
    const resaved = buildUserProfileFromOnboarding(
      { ...imperialDraft, weightKg: lbsToKg(redisplayedLbs) },
      'local-user',
      '2026-06-10T10:00:00.000Z',
    );
    expect(resaved.weightKg).toBe(profile.weightKg);
  });
});
