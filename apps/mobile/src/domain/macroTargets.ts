import type { MacroTargets, UserProfile } from './types';

const ageMidpoints: Record<UserProfile['ageRange'], number> = {
  '18-24': 21,
  '25-34': 30,
  '35-44': 40,
  '45-54': 50,
  '55+': 60,
};

const activityFactors: Record<UserProfile['activityLevel'], number> = {
  low: 1.35,
  moderate: 1.55,
  high: 1.75,
};

function estimateBmr(profile: UserProfile): number {
  const age = ageMidpoints[profile.ageRange];
  const sexOffset = profile.sex === 'female' ? -161 : profile.sex === 'male' ? 5 : -78;

  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + sexOffset;
}

function goalCalorieFactor(goal: UserProfile['goal']): number {
  if (goal === 'lose_fat') {
    return 0.86;
  }

  if (goal === 'build_muscle') {
    return 1.08;
  }

  return 1;
}

function proteinMultiplier(goal: UserProfile['goal']): number {
  if (goal === 'lose_fat' || goal === 'build_muscle') {
    return 2;
  }

  return 1.6;
}

function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function calculateMacroTargets(profile: UserProfile): MacroTargets {
  const tdee = estimateBmr(profile) * activityFactors[profile.activityLevel];
  const calculatedCalories = roundToNearestTen(tdee * goalCalorieFactor(profile.goal));
  const calorieTarget = profile.targets.calorieOverride ?? calculatedCalories;
  const proteinTargetG = profile.targets.proteinOverrideG ?? Math.round(profile.weightKg * proteinMultiplier(profile.goal));
  const fatTargetG = Math.max(50, Math.round((calorieTarget * 0.28) / 9));
  const proteinCalories = proteinTargetG * 4;
  const fatCalories = fatTargetG * 9;
  const carbsTargetG = Math.max(0, Math.round((calorieTarget - proteinCalories - fatCalories) / 4));

  return {
    calorieTarget,
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    fiberTargetG: Math.round(Math.max(25, Math.min(40, calorieTarget / 80))),
    calorieOverride: profile.targets.calorieOverride,
    proteinOverrideG: profile.targets.proteinOverrideG,
  };
}

export function withCalculatedTargets(profile: UserProfile): UserProfile {
  return {
    ...profile,
    targets: calculateMacroTargets(profile),
    updatedAt: new Date().toISOString(),
  };
}
