/**
 * Pure step machine + option metadata for the 12-step onboarding funnel
 * (W3 — "Clinical Trust" prototype, design/macrolens-redesign.html).
 *
 * No React in this file: everything is unit-testable. Domain stays untouched —
 * the funnel only maps UI choices onto the existing OnboardingProfileDraft
 * fields (goal, sex, heightCm, weightKg, targetWeightKg, weeklyPaceKg,
 * activityLevel). Answers without a domain home (source, diet, obstacles)
 * surface as privacy-safe analytics payload keys and are then dropped.
 */
import type { TrackingFriction } from '../../domain/onboardingConversion';
import type { UserGoal, UserProfile } from '../../domain/types';
import { kgToLbs, lbsToKg, type UnitSystem } from '../../domain/units';

export type OnboardingStepId =
  | 'welcome'
  | 'source'
  | 'goal'
  | 'sex'
  | 'body'
  | 'target_weight'
  | 'speed'
  | 'activity'
  | 'diet'
  | 'obstacles'
  | 'compare'
  | 'value_proof'
  | 'generating'
  | 'plan'
  | 'perms';

/** Full screen order: welcome first, perms last, generating between value_proof and plan. */
export const FUNNEL_STEPS: OnboardingStepId[] = [
  'welcome',
  'source',
  'goal',
  'sex',
  'body',
  'target_weight',
  'speed',
  'activity',
  'diet',
  'obstacles',
  'compare',
  'value_proof',
  'generating',
  'plan',
  'perms',
];

/** The 12 steps that show the "NN / 12" mono counter + progress bar (welcome, generating, perms are unnumbered). */
export const NUMBERED_STEPS: OnboardingStepId[] = [
  'source',
  'goal',
  'sex',
  'body',
  'target_weight',
  'speed',
  'activity',
  'diet',
  'obstacles',
  'compare',
  'value_proof',
  'plan',
];

/** "NN / 12" counter + progress for a step, or null for unnumbered screens. */
export function stepCounter(step: OnboardingStepId): { index: number; total: number; progressPct: number } | null {
  const position = NUMBERED_STEPS.indexOf(step);
  if (position < 0) {
    return null;
  }

  const total = NUMBERED_STEPS.length;
  return { index: position + 1, total, progressPct: Math.round(((position + 1) / total) * 100) };
}

// ─── Option keys (analytics-only answers use snake_case keys, never free text) ─

export const SOURCE_OPTION_KEYS = ['instagram', 'tiktok', 'friend', 'app_store', 'youtube', 'other'] as const;
export type SourceOptionKey = (typeof SOURCE_OPTION_KEYS)[number];

export const DIET_OPTION_KEYS = ['classic', 'low_carb', 'vegetarian', 'vegan', 'mediterranean', 'gluten_free'] as const;
export type DietOptionKey = (typeof DIET_OPTION_KEYS)[number];

export const OBSTACLE_OPTION_KEYS = ['lack_of_time', 'snacking', 'restaurant_meals', 'motivation', 'tedious_tracking', 'weekends'] as const;
export type ObstacleOptionKey = (typeof OBSTACLE_OPTION_KEYS)[number];

/**
 * Obstacles → the existing TrackingFriction domain values (no domain change).
 * The first selected obstacle decides the primary friction used by
 * onboarding_completed analytics; unselected funnels fall back to the
 * historical default ('restaurant_meals').
 */
const obstacleFriction: Record<ObstacleOptionKey, TrackingFriction> = {
  lack_of_time: 'forgetting_meals',
  snacking: 'hidden_calories',
  restaurant_meals: 'restaurant_meals',
  motivation: 'forgetting_meals',
  tedious_tracking: 'weighing_food',
  weekends: 'restaurant_meals',
};

export function frictionFromObstacles(obstacles: readonly ObstacleOptionKey[]): TrackingFriction {
  return obstacles.length > 0 ? obstacleFriction[obstacles[0]] : 'restaurant_meals';
}

// ─── Pace + activity mappings onto existing draft fields ─────────────────────

export type PaceOptionKey = 'relaxed' | 'steady' | 'fast';

/** 3 paces from the prototype, mapped onto the existing weekly kg presets. The middle one carries the "Recommended" chip. */
export const PACE_OPTIONS: { key: PaceOptionKey; weeklyPaceKg: number; recommended: boolean }[] = [
  { key: 'relaxed', weeklyPaceKg: 0.25, recommended: false },
  { key: 'steady', weeklyPaceKg: 0.5, recommended: true },
  { key: 'fast', weeklyPaceKg: 0.75, recommended: false },
];

export type ActivityOptionKey = 'sedentary' | 'light' | 'moderate' | 'intense';

/**
 * 4 prototype levels → the 3 existing domain levels (factors 1.35/1.55/1.75).
 * 'light' (1-3 sessions/week) maps conservatively to 'low', in line with the
 * product's conservative-estimates stance.
 */
export const ACTIVITY_OPTIONS: { key: ActivityOptionKey; level: UserProfile['activityLevel'] }[] = [
  { key: 'sedentary', level: 'low' },
  { key: 'light', level: 'low' },
  { key: 'moderate', level: 'moderate' },
  { key: 'intense', level: 'high' },
];

// ─── Numeric helpers (display unit at the edges, metric in storage — S2) ─────

export function parseLocaleNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatFieldNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Default target suggestion, computed in metric (matches the legacy wizard behavior). */
export function suggestedTargetWeightKg(weightKg: number, goal: UserGoal): number {
  if (weightKg <= 0) {
    return 0;
  }

  if (goal === 'lose_fat') {
    return Math.max(35, Math.round(weightKg * 0.9 * 10) / 10);
  }

  if (goal === 'build_muscle') {
    return Math.min(250, Math.round(weightKg * 1.05 * 10) / 10);
  }

  return weightKg;
}

/**
 * Target-weight stepper config in the DISPLAY unit. Bounds stay inside the
 * domain's 35–250 kg validity window after conversion back to metric.
 */
export function targetStepperConfig(system: UnitSystem): { min: number; max: number; step: number } {
  if (system === 'imperial') {
    return { min: Math.ceil(kgToLbs(35)), max: Math.floor(kgToLbs(250)), step: 1 };
  }

  return { min: 35, max: 250, step: 0.5 };
}

export function clampTargetDisplayWeight(value: number, system: UnitSystem): number {
  const { min, max } = targetStepperConfig(system);
  return Math.min(max, Math.max(min, value));
}

/** kg → display number (whole lbs imperial, half-kg metric). Display-only rounding. */
export function displayWeightFromKg(kg: number, system: UnitSystem): number {
  return system === 'imperial' ? Math.round(kgToLbs(kg)) : Math.round(kg * 2) / 2;
}

/** Display number → kg, unrounded (storage direction, anti-drift per units.ts). */
export function kgFromDisplayWeight(value: number, system: UnitSystem): number {
  return system === 'imperial' ? lbsToKg(value) : value;
}

/** Signed delta label for the realistic-objective card, e.g. "−11 lbs" / "+2.5 kg". */
export function formatSignedWeightDelta(deltaDisplay: number, system: UnitSystem): string {
  const magnitude = Math.abs(Math.round(deltaDisplay * 10) / 10);
  const amount = Number.isInteger(magnitude) ? String(magnitude) : magnitude.toFixed(1);
  const unit = system === 'imperial' ? 'lbs' : 'kg';
  return `${deltaDisplay < 0 ? '−' : '+'}${amount} ${unit}`;
}
