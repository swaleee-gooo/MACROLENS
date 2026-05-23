import { describe, expect, it } from 'vitest';
import { recalculateMeal, scaleFoodItem, sumFoodItems } from './nutrition';
import type { FoodItem, Meal } from './types';

const items: FoodItem[] = [
  {
    id: 'item-1',
    mealId: 'meal-1',
    name: 'Chicken breast',
    canonicalFoodName: 'chicken breast cooked',
    estimatedQuantity: 150,
    unit: 'g',
    calories: 248,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    fiberG: 0,
    confidence: 'high',
    dataSource: 'usda',
    sourceFoodId: '171077',
  },
  {
    id: 'item-2',
    mealId: 'meal-1',
    name: 'Rice',
    canonicalFoodName: 'white rice cooked',
    estimatedQuantity: 180,
    unit: 'g',
    calories: 234,
    proteinG: 4.9,
    carbsG: 51.1,
    fatG: 0.5,
    fiberG: 0.7,
    confidence: 'medium',
    dataSource: 'usda',
    sourceFoodId: '169756',
  },
];

describe('nutrition math', () => {
  it('sums food items with rounded macro totals and a calorie range', () => {
    expect(sumFoodItems(items)).toEqual({
      calories: 482,
      caloriesLow: 410,
      caloriesHigh: 554,
      proteinG: 51.4,
      carbsG: 51.1,
      fatG: 5.9,
      fiberG: 0.7,
    });
  });

  it('scales a food item without mutating the original', () => {
    const scaled = scaleFoodItem(items[0], 1.2);

    expect(scaled.calories).toBe(298);
    expect(scaled.proteinG).toBe(55.8);
    expect(items[0].calories).toBe(248);
  });

  it('recalculates a meal from its items', () => {
    const meal: Meal = {
      id: 'meal-1',
      userId: 'local-user',
      imageUri: 'file://meal.jpg',
      capturedAt: '2026-05-23T12:30:00.000Z',
      mealName: 'Chicken rice bowl',
      caloriesEstimate: 0,
      caloriesLow: 0,
      caloriesHigh: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      confidence: 'medium',
      notes: '',
      source: 'mock',
      items,
    };

    expect(recalculateMeal(meal).caloriesEstimate).toBe(482);
  });
});
