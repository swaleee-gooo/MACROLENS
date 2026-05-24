import { describe, expect, it } from 'vitest';
import { buildPremiumDashboardViewModel } from './premiumDashboardViewModel';
import type { MacroTargets, Meal } from '../domain/types';

const targets: MacroTargets = {
  calorieTarget: 2400,
  proteinTargetG: 150,
  carbsTargetG: 250,
  fatTargetG: 70,
  fiberTargetG: 30,
  calorieOverride: null,
  proteinOverrideG: null,
};

function meal(id: string, capturedAt: string, calories: number, proteinG: number): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: calories,
    caloriesLow: Math.round(calories * 0.85),
    caloriesHigh: Math.round(calories * 1.15),
    proteinG,
    carbsG: 50,
    fatG: 20,
    fiberG: 8,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildPremiumDashboardViewModel', () => {
  it('builds totals, remaining calories, progress and streak', () => {
    const vm = buildPremiumDashboardViewModel(
      [meal('today', '2026-05-24T10:00:00.000Z', 1850, 120), meal('yesterday', '2026-05-23T10:00:00.000Z', 500, 30)],
      '2026-05-24',
      targets,
    );

    expect(vm.calories.consumed).toBe(1850);
    expect(vm.calories.remaining).toBe(550);
    expect(vm.calories.progress).toBe(77);
    expect(vm.protein.progress).toBe(80);
    expect(vm.streakDays).toBe(2);
    expect(vm.nextBadge.label).toBe('Chef Etoile');
  });
});
