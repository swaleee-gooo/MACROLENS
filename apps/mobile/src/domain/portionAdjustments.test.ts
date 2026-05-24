import { describe, expect, it } from 'vitest';
import { adjustMealItemGrams } from './portionAdjustments';
import type { Meal } from './types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'manual://custom',
  capturedAt: '2026-05-24T10:00:00.000Z',
  mealName: 'Poulet',
  caloriesEstimate: 200,
  caloriesLow: 170,
  caloriesHigh: 230,
  proteinG: 40,
  carbsG: 0,
  fatG: 5,
  fiberG: 0,
  confidence: 'medium',
  notes: '',
  source: 'estimated',
  items: [
    {
      id: 'item-1',
      mealId: 'meal-1',
      name: 'Poulet',
      canonicalFoodName: 'chicken breast',
      estimatedQuantity: 100,
      unit: 'g',
      calories: 200,
      proteinG: 40,
      carbsG: 0,
      fatG: 5,
      fiberG: 0,
      confidence: 'medium',
      dataSource: 'estimated',
      sourceFoodId: null,
    },
  ],
};

describe('adjustMealItemGrams', () => {
  it('scales the selected item and recalculates meal totals', () => {
    const adjusted = adjustMealItemGrams(meal, 'item-1', 150);

    expect(adjusted.items[0].estimatedQuantity).toBe(150);
    expect(adjusted.caloriesEstimate).toBe(300);
    expect(adjusted.proteinG).toBe(60);
  });

  it('enforces a safe minimum', () => {
    const adjusted = adjustMealItemGrams(meal, 'item-1', 5);

    expect(adjusted.items[0].estimatedQuantity).toBe(25);
  });
});
