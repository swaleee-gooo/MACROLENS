import { describe, expect, it } from 'vitest';
import { buildTodayViewModel } from './todayViewModel';
import type { MacroTargets, Meal } from '../domain/types';

const targets: MacroTargets = {
  calorieTarget: 2200,
  proteinTargetG: 160,
  carbsTargetG: 220,
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
    confidence: 'low',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildTodayViewModel', () => {
  it('filters meals for the selected day and computes target progress', () => {
    const viewModel = buildTodayViewModel(
      [
        meal('today-1', '2026-05-24T08:00:00.000Z', 500, 35),
        meal('today-2', '2026-05-24T12:00:00.000Z', 700, 45),
        meal('yesterday', '2026-05-23T12:00:00.000Z', 900, 60),
      ],
      '2026-05-24',
      targets,
    );

    expect(viewModel.meals).toHaveLength(2);
    expect(viewModel.summary.calories).toBe(1200);
    expect(viewModel.calorieProgress).toBe(55);
    expect(viewModel.proteinProgress).toBe(50);
  });

  it('works without targets', () => {
    const viewModel = buildTodayViewModel([meal('today', '2026-05-24T08:00:00.000Z', 500, 35)], '2026-05-24', null);

    expect(viewModel.calorieProgress).toBeNull();
    expect(viewModel.proteinProgress).toBeNull();
  });
});
