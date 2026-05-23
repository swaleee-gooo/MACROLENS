import { describe, expect, it } from 'vitest';
import { createMealRepository, createMemoryStorageAdapter } from './mealRepository';
import type { Meal } from '../domain/types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'file://meal.jpg',
  capturedAt: '2026-05-23T12:30:00.000Z',
  mealName: 'Poulet, riz et legumes',
  caloriesEstimate: 506,
  caloriesLow: 430,
  caloriesHigh: 582,
  proteinG: 51,
  carbsG: 57.3,
  fatG: 6.1,
  fiberG: 4.6,
  confidence: 'medium',
  notes: '',
  source: 'mock',
  items: [],
};

describe('meal repository', () => {
  it('saves and lists meals newest first', async () => {
    const repository = createMealRepository(createMemoryStorageAdapter());

    await repository.saveMeal(meal);
    await repository.saveMeal({ ...meal, id: 'meal-2', capturedAt: '2026-05-23T13:30:00.000Z' });

    expect((await repository.listMeals()).map((savedMeal) => savedMeal.id)).toEqual(['meal-2', 'meal-1']);
  });

  it('deletes a meal', async () => {
    const repository = createMealRepository(createMemoryStorageAdapter());

    await repository.saveMeal(meal);
    await repository.deleteMeal('meal-1');

    expect(await repository.listMeals()).toEqual([]);
  });
});
