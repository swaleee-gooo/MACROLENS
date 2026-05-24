import { calculateMacroTargets } from './macroTargets';
import type { UserGoal, UserProfile } from './types';

export type OnboardingProfileDraft = {
  goal: UserGoal;
  age: number;
  sex: 'female' | 'male';
  heightCm: number;
  weightKg: number;
  activityLevel: UserProfile['activityLevel'];
};

function ageRangeFromAge(age: number): UserProfile['ageRange'] {
  if (age <= 24) {
    return '18-24';
  }

  if (age <= 34) {
    return '25-34';
  }

  if (age <= 44) {
    return '35-44';
  }

  if (age <= 54) {
    return '45-54';
  }

  return '55+';
}

export function isOnboardingDraftValid(draft: OnboardingProfileDraft): boolean {
  return draft.age >= 18 && draft.age <= 85 && draft.heightCm >= 120 && draft.heightCm <= 230 && draft.weightKg >= 35 && draft.weightKg <= 250;
}

export function buildUserProfileFromOnboarding(draft: OnboardingProfileDraft, userId: string, updatedAt = new Date().toISOString()): UserProfile {
  const baseProfile: UserProfile = {
    id: userId,
    goal: draft.goal,
    ageRange: ageRangeFromAge(draft.age),
    sex: draft.sex,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    activityLevel: draft.activityLevel,
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
    updatedAt,
  };

  return {
    ...baseProfile,
    targets: calculateMacroTargets(baseProfile),
  };
}
