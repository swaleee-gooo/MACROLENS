import { describe, expect, it } from 'vitest';
import { applyMealCorrection, getMealCorrectionType } from './corrections';
import type { Meal } from './types';

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
  items: [
    {
      id: 'item-1',
      mealId: 'meal-1',
      name: 'Poulet grille',
      canonicalFoodName: 'chicken breast cooked',
      estimatedQuantity: 140,
      unit: 'g',
      calories: 231,
      proteinG: 43.4,
      carbsG: 0,
      fatG: 5,
      fiberG: 0,
      confidence: 'medium',
      dataSource: 'mock',
      sourceFoodId: null,
    },
  ],
};

describe('applyMealCorrection', () => {
  it('increases all portions by 15 percent', () => {
    const corrected = applyMealCorrection(meal, { type: 'portion_up', targetItemId: null });

    expect(corrected.items[0].estimatedQuantity).toBe(161);
    expect(corrected.caloriesEstimate).toBe(266);
  });

  it('adds oil as a new estimated item', () => {
    const corrected = applyMealCorrection(meal, { type: 'add_oil', targetItemId: null });

    expect(corrected.items.some((item) => item.name === 'Huile de cuisson')).toBe(true);
    expect(corrected.fatG).toBe(19);
  });

  it('removes a target item', () => {
    const corrected = applyMealCorrection(meal, { type: 'remove_item', targetItemId: 'item-1' });

    expect(corrected.items).toHaveLength(0);
    expect(corrected.caloriesEstimate).toBe(0);
  });

  it('exposes a stable correction type for analytics', () => {
    expect(getMealCorrectionType({ type: 'add_sauce', targetItemId: null })).toBe('add_sauce');
  });
});
