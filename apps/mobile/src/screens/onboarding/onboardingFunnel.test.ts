import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_OPTIONS,
  clampTargetDisplayWeight,
  displayWeightFromKg,
  formatSignedWeightDelta,
  frictionFromObstacles,
  FUNNEL_STEPS,
  kgFromDisplayWeight,
  NUMBERED_STEPS,
  PACE_OPTIONS,
  stepCounter,
  suggestedTargetWeightKg,
  targetStepperConfig,
} from './onboardingFunnel';

describe('onboarding funnel step machine', () => {
  it('keeps the validated 12-step order between welcome and perms', () => {
    expect(NUMBERED_STEPS).toEqual(['source', 'goal', 'sex', 'body', 'target_weight', 'speed', 'activity', 'diet', 'obstacles', 'compare', 'value_proof', 'plan']);
    expect(FUNNEL_STEPS[0]).toBe('welcome');
    expect(FUNNEL_STEPS[FUNNEL_STEPS.length - 1]).toBe('perms');
    // generating sits between value_proof and plan but is unnumbered.
    expect(FUNNEL_STEPS.indexOf('generating')).toBe(FUNNEL_STEPS.indexOf('value_proof') + 1);
    expect(FUNNEL_STEPS.indexOf('plan')).toBe(FUNNEL_STEPS.indexOf('generating') + 1);
  });

  it('numbers the funnel "NN / 12" and leaves splash screens unnumbered', () => {
    expect(stepCounter('source')).toEqual({ index: 1, total: 12, progressPct: 8 });
    expect(stepCounter('plan')).toEqual({ index: 12, total: 12, progressPct: 100 });
    expect(stepCounter('welcome')).toBeNull();
    expect(stepCounter('generating')).toBeNull();
    expect(stepCounter('perms')).toBeNull();
  });
});

describe('obstacles → existing friction mapping', () => {
  it('maps the first selected obstacle onto a TrackingFriction value', () => {
    expect(frictionFromObstacles(['tedious_tracking', 'weekends'])).toBe('weighing_food');
    expect(frictionFromObstacles(['snacking'])).toBe('hidden_calories');
    expect(frictionFromObstacles(['restaurant_meals'])).toBe('restaurant_meals');
    expect(frictionFromObstacles(['lack_of_time'])).toBe('forgetting_meals');
  });

  it('falls back to the historical default when nothing is selected', () => {
    expect(frictionFromObstacles([])).toBe('restaurant_meals');
  });
});

describe('pace + activity mappings onto draft fields', () => {
  it('keeps the existing weekly kg presets with the middle pace recommended', () => {
    expect(PACE_OPTIONS.map((option) => option.weeklyPaceKg)).toEqual([0.25, 0.5, 0.75]);
    expect(PACE_OPTIONS.filter((option) => option.recommended).map((option) => option.key)).toEqual(['steady']);
  });

  it('maps the 4 prototype levels onto the 3 existing domain levels', () => {
    expect(ACTIVITY_OPTIONS.map((option) => option.level)).toEqual(['low', 'low', 'moderate', 'high']);
  });
});

describe('target-weight stepper (display unit, metric storage)', () => {
  it('keeps imperial bounds inside the domain 35-250 kg window', () => {
    const { min, max, step } = targetStepperConfig('imperial');
    expect(step).toBe(1);
    expect(kgFromDisplayWeight(min, 'imperial')).toBeGreaterThanOrEqual(35);
    expect(kgFromDisplayWeight(max, 'imperial')).toBeLessThanOrEqual(250);
  });

  it('clamps stepping past the bounds', () => {
    expect(clampTargetDisplayWeight(20, 'metric')).toBe(35);
    expect(clampTargetDisplayWeight(9999, 'metric')).toBe(250);
    expect(clampTargetDisplayWeight(10, 'imperial')).toBe(targetStepperConfig('imperial').min);
  });

  it('round-trips display weights without drifting the stored kg', () => {
    // 165 lbs stays 165 lbs after the unrounded storage conversion.
    expect(displayWeightFromKg(kgFromDisplayWeight(165, 'imperial'), 'imperial')).toBe(165);
    expect(displayWeightFromKg(kgFromDisplayWeight(70.5, 'metric'), 'metric')).toBe(70.5);
  });

  it('suggests a target from the current weight and goal (metric, legacy behavior)', () => {
    expect(suggestedTargetWeightKg(80, 'lose_fat')).toBe(72);
    expect(suggestedTargetWeightKg(80, 'build_muscle')).toBe(84);
    expect(suggestedTargetWeightKg(80, 'maintain')).toBe(80);
    expect(suggestedTargetWeightKg(0, 'lose_fat')).toBe(0);
  });

  it('formats the signed delta for the realistic-objective card', () => {
    expect(formatSignedWeightDelta(-11, 'imperial')).toBe('−11 lbs');
    expect(formatSignedWeightDelta(2.5, 'metric')).toBe('+2.5 kg');
  });
});
