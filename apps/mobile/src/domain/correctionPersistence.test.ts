import { describe, expect, it } from 'vitest';
import { createCorrectionRepository } from '../metaboproof/correctionLoop';
import { applyMealCorrectionWithLedger } from './correctionPersistence';
import type { Meal } from './types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'user-1',
  imageUri: 'file://meal.jpg',
  capturedAt: '2026-06-04T12:00:00.000Z',
  mealName: 'Chicken rice',
  caloriesEstimate: 500,
  caloriesLow: 430,
  caloriesHigh: 580,
  proteinG: 35,
  carbsG: 60,
  fatG: 12,
  fiberG: 4,
  confidence: 'medium',
  notes: '',
  source: 'estimated',
  items: [
    {
      id: 'item-rice',
      mealId: 'meal-1',
      name: 'Rice',
      canonicalFoodName: 'rice cooked',
      estimatedQuantity: 200,
      unit: 'g',
      calories: 260,
      proteinG: 5,
      carbsG: 56,
      fatG: 1,
      fiberG: 1,
      confidence: 'medium',
      dataSource: 'estimated',
      sourceFoodId: null,
    },
  ],
};

describe('applyMealCorrectionWithLedger', () => {
  it('updates meal totals and persists a correction record', async () => {
    const repository = createCorrectionRepository();
    const corrected = await applyMealCorrectionWithLedger({
      meal,
      correction: { type: 'portion_up', targetItemId: 'item-rice' },
      repository,
      modelId: 'analyze-meal:v1',
      id: 'correction-1',
      createdAt: '2026-06-04T13:00:00.000Z',
    });

    expect(corrected.caloriesEstimate).toBe(299);
    await expect(repository.listCorrections('user-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'correction-1',
        mealId: 'meal-1',
        itemId: 'item-rice',
        foodLabel: 'Rice',
        modelId: 'analyze-meal:v1',
        field: 'portion',
        previousValue: 500,
        nextValue: 299,
        correctionType: 'portion_up',
      }),
    ]);
  });
});
