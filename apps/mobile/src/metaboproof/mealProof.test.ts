import { describe, expect, it } from 'vitest';
import { createMealProofMetadata } from './mealProof';
import type { Meal } from '../domain/types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'file://meal.jpg',
  capturedAt: '2026-06-04T10:00:00.000Z',
  mealName: 'Chicken rice',
  caloriesEstimate: 430,
  caloriesLow: 360,
  caloriesHigh: 510,
  proteinG: 38,
  carbsG: 45,
  fatG: 10,
  fiberG: 3,
  confidence: 'medium',
  notes: '',
  source: 'estimated',
  items: [
    {
      id: 'item-1',
      mealId: 'meal-1',
      name: 'Chicken',
      canonicalFoodName: 'chicken breast cooked',
      estimatedQuantity: 140,
      unit: 'g',
      calories: 231,
      proteinG: 43.4,
      carbsG: 0,
      fatG: 5,
      fiberG: 0,
      confidence: 'medium',
      dataSource: 'estimated',
      sourceFoodId: null,
    },
  ],
};

describe('createMealProofMetadata', () => {
  it('marks existing photo meals as visual-only estimates', () => {
    const proof = createMealProofMetadata(meal);

    expect(proof.status).toBe('estimated');
    expect(proof.evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
    expect(proof.kcalRange).toEqual({ min: 150, max: 312 });
  });

  it('marks barcode meals with consumed grams as verified', () => {
    const proof = createMealProofMetadata({
      ...meal,
      imageUri: 'product://3017620422003',
      source: 'open_food_facts',
      items: [
        {
          ...meal.items[0],
          name: 'Nutella',
          canonicalFoodName: 'nutella',
          estimatedQuantity: 30,
          calories: 162,
          proteinG: 1.9,
          carbsG: 17.3,
          fatG: 9.3,
          dataSource: 'open_food_facts',
          sourceFoodId: '3017620422003',
        },
      ],
    });

    expect(proof.status).toBe('verified');
    expect(proof.evidenceLevel).toBe('VERIFIED_BARCODE_WEIGHT');
    expect(proof.sources[0]).toEqual({
      provider: 'OPEN_FOOD_FACTS',
      externalId: '3017620422003',
      name: 'nutella',
    });
  });
});
