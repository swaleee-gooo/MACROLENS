import { describe, expect, it } from 'vitest';
import { buildDayReviewViewModel } from './dayReviewViewModel';
import type { MacroTargets, Meal } from '../domain/types';

const targets: MacroTargets = {
  calorieTarget: 2200,
  proteinTargetG: 150,
  carbsTargetG: 240,
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
    carbsG: 30,
    fatG: 12,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildDayReviewViewModel', () => {
  it('filters and sorts meals for the selected day', () => {
    const vm = buildDayReviewViewModel(
      [
        meal('dinner', '2026-05-24T20:00:00.000Z', 700, 45),
        meal('breakfast', '2026-05-24T08:00:00.000Z', 400, 30),
        meal('other', '2026-05-23T12:00:00.000Z', 500, 20),
      ],
      '2026-05-24',
      '2026-05-25',
      targets,
    );

    expect(vm.meals.map((selectedMeal) => selectedMeal.id)).toEqual(['breakfast', 'dinner']);
  });

  it('calculates calories and macros for the selected day', () => {
    const vm = buildDayReviewViewModel(
      [meal('breakfast', '2026-05-24T08:00:00.000Z', 400, 30), meal('dinner', '2026-05-24T20:00:00.000Z', 700, 45)],
      '2026-05-24',
      '2026-05-25',
      targets,
    );

    expect(vm.calories.consumed).toBe(1100);
    expect(vm.calories.remaining).toBe(1100);
    expect(vm.calories.progress).toBe(50);
    expect(vm.protein.consumed).toBe(75);
    expect(vm.carbs.consumed).toBe(60);
    expect(vm.fat.consumed).toBe(24);
  });

  it('formats today, yesterday and older day labels', () => {
    expect(buildDayReviewViewModel([], '2026-05-25', '2026-05-25', targets).subtitle).toBe("Aujourd'hui");
    expect(buildDayReviewViewModel([], '2026-05-24', '2026-05-25', targets).subtitle).toBe('Hier');
    expect(buildDayReviewViewModel([], '2026-05-22', '2026-05-25', targets).subtitle).toBe('Ven 22 mai');
  });
});
