import { describe, expect, it } from 'vitest';
import { calculatePackagedServingNutrition } from './packagedServing';

describe('calculatePackagedServingNutrition', () => {
  it('calculates macros for a selected product portion without calling it a meal', () => {
    const nutrition = calculatePackagedServingNutrition(
      {
        barcode: '3017620422003',
        name: 'Mayonnaise',
        caloriesPer100g: 680,
        proteinPer100g: 1.2,
        carbsPer100g: 2.1,
        fatPer100g: 75,
        fiberPer100g: 0,
        source: 'open_food_facts',
      },
      15,
    );

    expect(nutrition).toEqual({
      servingGrams: 15,
      calories: 102,
      proteinG: 0.2,
      carbsG: 0.3,
      fatG: 11.3,
      fiberG: 0,
    });
  });
});
