import { describe, expect, it } from 'vitest';
import { calibrateMealAnalysis, isNonFoodAnalysis } from './nutritionCalibration.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function createPokeBowlRaw(): RawMealAnalysis {
  return {
    isFoodPhoto: true,
    nonFoodReason: '',
    mealName: 'Poke bowl saumon riz avocat',
    mealCategory: 'poke_bowl',
    portionSize: 'standard',
    confidence: 'medium',
    uncertaintyReasons: ['base_rice_partly_hidden'],
    hiddenCalorieRisks: ['hidden rice base', 'sweet sauce'],
    items: [
      {
        name: 'Saumon',
        canonicalFoodName: 'salmon raw',
        estimatedQuantity: 80,
        unit: 'g',
        calories: 160,
        proteinG: 18,
        carbsG: 0,
        fatG: 9,
        fiberG: 0,
        confidence: 'medium',
      },
      {
        name: 'Riz',
        canonicalFoodName: 'cooked white rice',
        estimatedQuantity: 120,
        unit: 'g',
        calories: 156,
        proteinG: 3,
        carbsG: 34,
        fatG: 0.3,
        fiberG: 0.5,
        confidence: 'low',
      },
      {
        name: 'Avocat',
        canonicalFoodName: 'avocado',
        estimatedQuantity: 40,
        unit: 'g',
        calories: 64,
        proteinG: 0.8,
        carbsG: 3.4,
        fatG: 5.9,
        fiberG: 2.7,
        confidence: 'medium',
      },
      {
        name: 'Edamame',
        canonicalFoodName: 'edamame',
        estimatedQuantity: 40,
        unit: 'g',
        calories: 48,
        proteinG: 4.8,
        carbsG: 3.6,
        fatG: 2.1,
        fiberG: 2,
        confidence: 'medium',
      },
      {
        name: 'Legumes',
        canonicalFoodName: 'mixed vegetables',
        estimatedQuantity: 100,
        unit: 'g',
        calories: 50,
        proteinG: 1.7,
        carbsG: 9,
        fatG: 0.5,
        fiberG: 2.5,
        confidence: 'medium',
      },
    ],
  };
}

describe('nutrition calibration', () => {
  it('raises an underestimated salmon rice avocado poke bowl into a realistic restaurant range', () => {
    const calibrated = calibrateMealAnalysis(createPokeBowlRaw());

    expect(calibrated.caloriesEstimate).toBeGreaterThanOrEqual(780);
    expect(calibrated.caloriesEstimate).toBeLessThanOrEqual(1000);
    expect(calibrated.proteinG).toBeGreaterThanOrEqual(36);
    expect(calibrated.confidence).toBe('low');
    expect(calibrated.caloriesLow).toBeLessThan(calibrated.caloriesEstimate);
    expect(calibrated.caloriesHigh).toBeGreaterThan(calibrated.caloriesEstimate);
    expect(calibrated.uncertaintyReasons).toContain('base_rice_partly_hidden');
    expect(calibrated.uncertaintyReasons).toContain('poke_bowl_hidden_rice_or_sauce');
    expect(calibrated.correctionSuggestions.map((item) => item.correctionType)).toContain('add_sauce');
  });

  it('keeps a high-confidence simple food stable instead of applying restaurant bowl floors', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Banane',
      mealCategory: 'unknown',
      portionSize: 'standard',
      confidence: 'high',
      uncertaintyReasons: [],
      hiddenCalorieRisks: [],
      items: [
        {
          name: 'Banane',
          canonicalFoodName: 'banana',
          estimatedQuantity: 118,
          unit: 'g',
          calories: 105,
          proteinG: 1.3,
          carbsG: 27,
          fatG: 0.4,
          fiberG: 3.1,
          confidence: 'high',
        },
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);

    expect(calibrated.caloriesEstimate).toBeGreaterThanOrEqual(95);
    expect(calibrated.caloriesEstimate).toBeLessThanOrEqual(115);
    expect(calibrated.confidence).toBe('high');
    expect(calibrated.items).toHaveLength(1);
  });

  it('detects non-food analysis outputs before a meal response is created', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: false,
      nonFoodReason: 'The image shows a laptop keyboard.',
      mealName: '',
      mealCategory: 'unknown',
      portionSize: 'unknown',
      confidence: 'low',
      uncertaintyReasons: ['no_food_visible'],
      hiddenCalorieRisks: [],
      items: [],
    };

    expect(isNonFoodAnalysis(raw)).toBe(true);
  });
});
