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

  it('uses the deterministic oil profile for generic oil names', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Huile ajoutee',
      mealCategory: 'mixed_plate',
      portionSize: 'standard',
      confidence: 'medium',
      uncertaintyReasons: [],
      hiddenCalorieRisks: ['oil'],
      items: [
        {
          name: 'Oil',
          canonicalFoodName: 'oil',
          estimatedQuantity: 10,
          unit: 'g',
          calories: 20,
          proteinG: 0,
          carbsG: 0,
          fatG: 2,
          fiberG: 0,
          confidence: 'low',
        },
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);

    expect(calibrated.items[0].calories).toBe(88);
    expect(calibrated.items[0].fatG).toBe(10);
    expect(calibrated.correctionSuggestions.map((item) => item.correctionType)).toContain('add_oil');
  });

  it('applies poke bowl protein floors to tofu bowls too', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Poke tofu riz avocat',
      mealCategory: 'poke_bowl',
      portionSize: 'standard',
      confidence: 'medium',
      uncertaintyReasons: ['protein_partly_hidden'],
      hiddenCalorieRisks: ['hidden rice base', 'sauce'],
      items: [
        {
          name: 'Tofu',
          canonicalFoodName: 'tofu',
          estimatedQuantity: 60,
          unit: 'g',
          calories: 86,
          proteinG: 9.4,
          carbsG: 2.1,
          fatG: 5.2,
          fiberG: 1.4,
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
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);
    const tofu = calibrated.items.find((item) => item.canonicalFoodName === 'tofu');

    expect(tofu?.estimatedQuantity).toBeGreaterThanOrEqual(130);
    expect(calibrated.proteinG).toBeGreaterThanOrEqual(20);
    expect(calibrated.confidence).toBe('low');
  });

  it('stabilizes protein totals for near-identical ambiguous poke bowl scans', () => {
    function variant(proteinGrams: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: 'Poke bowl saumon',
        mealCategory: 'poke_bowl',
        portionSize: 'standard',
        confidence: 'medium',
        uncertaintyReasons: ['protein_visible_but_portion_estimated'],
        hiddenCalorieRisks: ['hidden rice base', 'sauce'],
        items: [
          {
            name: 'Saumon',
            canonicalFoodName: 'salmon raw',
            estimatedQuantity: proteinGrams,
            unit: 'g',
            calories: 208 * (proteinGrams / 100),
            proteinG: 20.4 * (proteinGrams / 100),
            carbsG: 0,
            fatG: 13.4 * (proteinGrams / 100),
            fiberG: 0,
            confidence: 'medium',
          },
          {
            name: 'Riz',
            canonicalFoodName: 'cooked white rice',
            estimatedQuantity: 220,
            unit: 'g',
            calories: 286,
            proteinG: 5.9,
            carbsG: 62,
            fatG: 0.7,
            fiberG: 0.9,
            confidence: 'low',
          },
          {
            name: 'Legumes',
            canonicalFoodName: 'mixed vegetables',
            estimatedQuantity: 100,
            unit: 'g',
            calories: 30,
            proteinG: 1.8,
            carbsG: 6,
            fatG: 0.2,
            fiberG: 2.2,
            confidence: 'medium',
          },
        ],
      };
    }

    const lowerEstimate = calibrateMealAnalysis(variant(132));
    const higherEstimate = calibrateMealAnalysis(variant(158));

    expect(Math.abs(lowerEstimate.proteinG - higherEstimate.proteinG)).toBeLessThanOrEqual(2);
  });

  it('normalizes gram unit aliases before stabilizing repeated poke bowl protein estimates', () => {
    function variant(proteinGrams: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: 'Salmon Poke Bowl',
        mealCategory: 'poke_bowl',
        portionSize: 'standard',
        confidence: 'medium',
        uncertaintyReasons: ['protein_visible_but_portion_estimated'],
        hiddenCalorieRisks: ['hidden rice base', 'sauce'],
        items: [
          {
            name: 'Raw salmon chunks',
            canonicalFoodName: 'salmon',
            estimatedQuantity: proteinGrams,
            unit: 'grams',
            calories: 208 * (proteinGrams / 100),
            proteinG: 20.4 * (proteinGrams / 100),
            carbsG: 0,
            fatG: 13.4 * (proteinGrams / 100),
            fiberG: 0,
            confidence: 'high',
          },
          {
            name: 'Cooked white rice base',
            canonicalFoodName: 'white rice',
            estimatedQuantity: 150,
            unit: 'grams',
            calories: 195,
            proteinG: 4,
            carbsG: 43,
            fatG: 0.4,
            fiberG: 1.5,
            confidence: 'medium',
          },
          {
            name: 'Creamy spicy mayo sauce',
            canonicalFoodName: 'spicy mayo sauce',
            estimatedQuantity: 30,
            unit: 'grams',
            calories: 120,
            proteinG: 0,
            carbsG: 2,
            fatG: 12,
            fiberG: 0,
            confidence: 'medium',
          },
        ],
      };
    }

    const lowerEstimate = calibrateMealAnalysis(variant(80));
    const higherEstimate = calibrateMealAnalysis(variant(100));
    const salmonItem = lowerEstimate.items.find((item) => item.canonicalFoodName === 'salmon');
    const riceItem = lowerEstimate.items.find((item) => item.canonicalFoodName === 'white rice');

    expect(salmonItem?.unit).toBe('g');
    expect(salmonItem?.estimatedQuantity).toBe(130);
    expect(riceItem?.estimatedQuantity).toBe(220);
    expect(Math.abs(lowerEstimate.proteinG - higherEstimate.proteinG)).toBeLessThanOrEqual(2);
  });

  it('keeps poke bowl topping calories stable when OpenAI names the same visible items differently', () => {
    function variant(tempuraCanonicalName: string, fishRoeCalories: number, fishRoeProtein: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: 'Salmon Poke Bowl',
        mealCategory: 'poke_bowl',
        portionSize: 'standard',
        confidence: 'medium',
        uncertaintyReasons: ['visible_toppings_estimated'],
        hiddenCalorieRisks: ['hidden rice base', 'sauce'],
        items: [
          {
            name: 'Raw salmon',
            canonicalFoodName: 'salmon',
            estimatedQuantity: 130,
            unit: 'g',
            calories: 270,
            proteinG: 26.5,
            carbsG: 0,
            fatG: 17.4,
            fiberG: 0,
            confidence: 'medium',
          },
          {
            name: 'Cooked white rice',
            canonicalFoodName: 'white rice',
            estimatedQuantity: 220,
            unit: 'g',
            calories: 286,
            proteinG: 5.9,
            carbsG: 62,
            fatG: 0.7,
            fiberG: 0.9,
            confidence: 'low',
          },
          {
            name: 'Fried tempura piece',
            canonicalFoodName: tempuraCanonicalName,
            estimatedQuantity: 30,
            unit: 'g',
            calories: 9,
            proteinG: 0.5,
            carbsG: 1.8,
            fatG: 0.1,
            fiberG: 0.7,
            confidence: 'medium',
          },
          {
            name: 'Fish roe',
            canonicalFoodName: 'fish roe',
            estimatedQuantity: 10,
            unit: 'g',
            calories: fishRoeCalories,
            proteinG: fishRoeProtein,
            carbsG: 1,
            fatG: 1,
            fiberG: 0,
            confidence: 'medium',
          },
          {
            name: 'Seaweed sheets',
            canonicalFoodName: 'seaweed nori',
            estimatedQuantity: 5,
            unit: 'g',
            calories: 20,
            proteinG: 1,
            carbsG: 1,
            fatG: 0,
            fiberG: 1,
            confidence: 'high',
          },
          {
            name: 'Creamy spicy mayo sauce',
            canonicalFoodName: 'spicy mayo sauce',
            estimatedQuantity: 30,
            unit: 'g',
            calories: 90,
            proteinG: 0.3,
            carbsG: 3,
            fatG: 8.4,
            fiberG: 0,
            confidence: 'medium',
          },
        ],
      };
    }

    const vegetableNamedTempura = calibrateMealAnalysis(variant('tempura fried vegetable or shrimp', 40, 5));
    const genericTempura = calibrateMealAnalysis(variant('tempura', 15, 1));
    const tempura = vegetableNamedTempura.items.find((item) => item.name === 'Fried tempura piece');
    const fishRoe = vegetableNamedTempura.items.find((item) => item.canonicalFoodName === 'fish roe');

    expect(tempura?.calories).toBe(90);
    expect(tempura?.carbsG).toBe(8);
    expect(fishRoe?.calories).toBe(14);
    expect(fishRoe?.proteinG).toBe(2.2);
    expect(Math.abs(vegetableNamedTempura.caloriesEstimate - genericTempura.caloriesEstimate)).toBeLessThanOrEqual(5);
    expect(Math.abs(vegetableNamedTempura.proteinG - genericTempura.proteinG)).toBeLessThanOrEqual(1);
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
