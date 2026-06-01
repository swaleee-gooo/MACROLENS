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

function createSingleItemRaw(params: {
  mealName: string;
  mealCategory: RawMealAnalysis['mealCategory'];
  hiddenCalorieRisks?: string[];
  uncertaintyReasons?: string[];
  confidence?: RawMealAnalysis['confidence'];
}): RawMealAnalysis {
  return {
    isFoodPhoto: true,
    nonFoodReason: '',
    mealName: params.mealName,
    mealCategory: params.mealCategory,
    portionSize: 'standard',
    confidence: params.confidence ?? 'medium',
    uncertaintyReasons: params.uncertaintyReasons ?? ['portion_estimated'],
    hiddenCalorieRisks: params.hiddenCalorieRisks ?? [],
    items: [
      {
        name: params.mealName,
        canonicalFoodName: params.mealName,
        estimatedQuantity: 300,
        unit: 'g',
        calories: 999,
        proteinG: 99,
        carbsG: 9,
        fatG: 88,
        fiberG: 1,
        confidence: params.confidence ?? 'medium',
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
    const proteinItem = lowerEstimate.items.find((item) => item.canonicalFoodName === 'poke protein');
    const riceItem = lowerEstimate.items.find((item) => item.canonicalFoodName === 'cooked white rice');

    expect(proteinItem?.unit).toBe('g');
    expect(proteinItem?.estimatedQuantity).toBe(130);
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
    expect(vegetableNamedTempura.uncertaintyReasons).toContain('known_dish_template_applied');
    expect(Math.abs(vegetableNamedTempura.caloriesEstimate - genericTempura.caloriesEstimate)).toBeLessThanOrEqual(5);
    expect(Math.abs(vegetableNamedTempura.proteinG - genericTempura.proteinG)).toBeLessThanOrEqual(1);
  });

  it('stabilizes salmon tuna poke bowls when identical scans alternate between protein and topping names', () => {
    function variant(mealName: string, items: RawMealAnalysis['items']): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName,
        mealCategory: 'poke_bowl',
        portionSize: 'standard',
        confidence: 'medium',
        uncertaintyReasons: ['toppings_visible_but_portion_estimated'],
        hiddenCalorieRisks: ['hidden rice base', 'spicy mayo sauce'],
        items,
      };
    }

    const edamameNamed = calibrateMealAnalysis(
      variant('Poke Bowl with Edamame and Sauce', [
        {
          name: 'Edamame and mixed toppings',
          canonicalFoodName: 'edamame mixed vegetables',
          estimatedQuantity: 160,
          unit: 'g',
          calories: 190,
          proteinG: 16,
          carbsG: 18,
          fatG: 8,
          fiberG: 10,
          confidence: 'medium',
        },
        {
          name: 'Rice base',
          canonicalFoodName: 'cooked white rice',
          estimatedQuantity: 250,
          unit: 'g',
          calories: 325,
          proteinG: 7,
          carbsG: 70,
          fatG: 0.8,
          fiberG: 1,
          confidence: 'low',
        },
      ]),
    );
    const salmonTunaNamed = calibrateMealAnalysis(
      variant('Poke Bowl with Salmon and Tuna', [
        {
          name: 'Salmon and tuna cubes',
          canonicalFoodName: 'salmon tuna raw fish',
          estimatedQuantity: 180,
          unit: 'g',
          calories: 310,
          proteinG: 43,
          carbsG: 0,
          fatG: 15,
          fiberG: 0,
          confidence: 'medium',
        },
        {
          name: 'Sushi rice',
          canonicalFoodName: 'sushi rice',
          estimatedQuantity: 210,
          unit: 'g',
          calories: 273,
          proteinG: 5.7,
          carbsG: 59,
          fatG: 0.6,
          fiberG: 0.8,
          confidence: 'low',
        },
      ]),
    );

    expect(edamameNamed.uncertaintyReasons).toContain('known_dish_template_applied');
    expect(Math.abs(edamameNamed.caloriesEstimate - salmonTunaNamed.caloriesEstimate)).toBeLessThanOrEqual(10);
    expect(Math.abs(edamameNamed.proteinG - salmonTunaNamed.proteinG)).toBeLessThanOrEqual(1);
  });

  it('stabilizes chicken Caesar salad when dressing and croutons drift between identical scans', () => {
    function variant(dressingGrams: number, croutonGrams: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: 'Chicken Caesar Salad',
        mealCategory: 'salad',
        portionSize: 'standard',
        confidence: 'high',
        uncertaintyReasons: ['dressing_visible_but_amount_estimated'],
        hiddenCalorieRisks: ['dressing', 'parmesan'],
        items: [
          {
            name: 'Grilled chicken breast',
            canonicalFoodName: 'chicken breast cooked',
            estimatedQuantity: 145,
            unit: 'g',
            calories: 239,
            proteinG: 45,
            carbsG: 0,
            fatG: 5.2,
            fiberG: 0,
            confidence: 'high',
          },
          {
            name: 'Romaine lettuce',
            canonicalFoodName: 'romaine lettuce',
            estimatedQuantity: 120,
            unit: 'g',
            calories: 20,
            proteinG: 1.5,
            carbsG: 4,
            fatG: 0.3,
            fiberG: 2,
            confidence: 'high',
          },
          {
            name: 'Caesar dressing',
            canonicalFoodName: 'creamy dressing',
            estimatedQuantity: dressingGrams,
            unit: 'g',
            calories: dressingGrams * 3,
            proteinG: 0.2,
            carbsG: 2,
            fatG: dressingGrams * 0.28,
            fiberG: 0,
            confidence: 'medium',
          },
          {
            name: 'Croutons',
            canonicalFoodName: 'croutons bread',
            estimatedQuantity: croutonGrams,
            unit: 'g',
            calories: croutonGrams * 3,
            proteinG: 2,
            carbsG: croutonGrams * 0.5,
            fatG: 1,
            fiberG: 1,
            confidence: 'medium',
          },
        ],
      };
    }

    const lowerEstimate = calibrateMealAnalysis(variant(20, 20));
    const higherEstimate = calibrateMealAnalysis(variant(35, 35));

    expect(Math.abs(lowerEstimate.caloriesEstimate - higherEstimate.caloriesEstimate)).toBeLessThanOrEqual(10);
    expect(lowerEstimate.uncertaintyReasons).toContain('known_dish_template_applied');
  });

  it('stabilizes burger and fries when identical scans alternate between single and larger burger interpretations', () => {
    function variant(beefGrams: number, friesGrams: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: 'Bacon Cheeseburger with Fries',
        mealCategory: 'burger_fries',
        portionSize: 'standard',
        confidence: 'high',
        uncertaintyReasons: ['patty_size_estimated'],
        hiddenCalorieRisks: ['sauce', 'fries oil'],
        items: [
          {
            name: 'Beef patty',
            canonicalFoodName: 'beef patty',
            estimatedQuantity: beefGrams,
            unit: 'g',
            calories: beefGrams * 2.5,
            proteinG: beefGrams * 0.26,
            carbsG: 0,
            fatG: beefGrams * 0.15,
            fiberG: 0,
            confidence: 'medium',
          },
          {
            name: 'Burger bun',
            canonicalFoodName: 'burger bun',
            estimatedQuantity: 80,
            unit: 'g',
            calories: 216,
            proteinG: 7,
            carbsG: 39,
            fatG: 3.4,
            fiberG: 1.8,
            confidence: 'high',
          },
          {
            name: 'French fries',
            canonicalFoodName: 'fries',
            estimatedQuantity: friesGrams,
            unit: 'g',
            calories: friesGrams * 3.12,
            proteinG: friesGrams * 0.034,
            carbsG: friesGrams * 0.41,
            fatG: friesGrams * 0.15,
            fiberG: friesGrams * 0.038,
            confidence: 'medium',
          },
        ],
      };
    }

    const lowerEstimate = calibrateMealAnalysis(variant(100, 100));
    const higherEstimate = calibrateMealAnalysis(variant(180, 170));

    expect(Math.abs(lowerEstimate.caloriesEstimate - higherEstimate.caloriesEstimate)).toBeLessThanOrEqual(10);
    expect(Math.abs(lowerEstimate.proteinG - higherEstimate.proteinG)).toBeLessThanOrEqual(1);
  });

  it('stabilizes chicken rice vegetable plates when the rice estimate changes between scans', () => {
    function variant(riceGrams: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: 'Roasted chicken thigh with rice and mixed vegetables',
        mealCategory: 'mixed_plate',
        portionSize: 'standard',
        confidence: 'high',
        uncertaintyReasons: ['rice_portion_estimated'],
        hiddenCalorieRisks: ['cooking oil'],
        items: [
          {
            name: 'Roasted chicken',
            canonicalFoodName: 'chicken breast cooked',
            estimatedQuantity: 130,
            unit: 'g',
            calories: 215,
            proteinG: 40,
            carbsG: 0,
            fatG: 4.7,
            fiberG: 0,
            confidence: 'high',
          },
          {
            name: 'White rice',
            canonicalFoodName: 'white rice cooked',
            estimatedQuantity: riceGrams,
            unit: 'g',
            calories: riceGrams * 1.3,
            proteinG: riceGrams * 0.027,
            carbsG: riceGrams * 0.282,
            fatG: riceGrams * 0.003,
            fiberG: riceGrams * 0.004,
            confidence: 'medium',
          },
          {
            name: 'Mixed vegetables',
            canonicalFoodName: 'mixed vegetables',
            estimatedQuantity: 120,
            unit: 'g',
            calories: 36,
            proteinG: 2.2,
            carbsG: 7.2,
            fatG: 0.2,
            fiberG: 2.6,
            confidence: 'high',
          },
        ],
      };
    }

    const lowerEstimate = calibrateMealAnalysis(variant(110));
    const higherEstimate = calibrateMealAnalysis(variant(180));

    expect(Math.abs(lowerEstimate.caloriesEstimate - higherEstimate.caloriesEstimate)).toBeLessThanOrEqual(10);
    expect(Math.abs(lowerEstimate.carbsG - higherEstimate.carbsG)).toBeLessThanOrEqual(2);
  });

  it('stabilizes chicken rice bell pepper plates under the same mixed-plate template', () => {
    const calibrated = calibrateMealAnalysis({
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Chicken and bell peppers with rice',
      mealCategory: 'mixed_plate',
      portionSize: 'standard',
      confidence: 'medium',
      uncertaintyReasons: ['oil_or_sauce_amount_estimated'],
      hiddenCalorieRisks: ['cooking oil'],
      items: [
        {
          name: 'Chicken breast',
          canonicalFoodName: 'chicken breast cooked',
          estimatedQuantity: 135,
          unit: 'g',
          calories: 223,
          proteinG: 41.9,
          carbsG: 0,
          fatG: 4.9,
          fiberG: 0,
          confidence: 'medium',
        },
        {
          name: 'White rice',
          canonicalFoodName: 'white rice cooked',
          estimatedQuantity: 160,
          unit: 'g',
          calories: 208,
          proteinG: 4.3,
          carbsG: 45.1,
          fatG: 0.5,
          fiberG: 0.6,
          confidence: 'medium',
        },
        {
          name: 'Bell peppers',
          canonicalFoodName: 'bell peppers',
          estimatedQuantity: 100,
          unit: 'g',
          calories: 31,
          proteinG: 1,
          carbsG: 6,
          fatG: 0.3,
          fiberG: 2.1,
          confidence: 'medium',
        },
      ],
    });

    expect(calibrated.caloriesEstimate).toBe(560);
    expect(calibrated.fatG).toBe(15.4);
    expect(calibrated.confidence).toBe('low');
  });

  it('calibrates coconut curry rice as sauce-heavy instead of a plain chicken rice plate', () => {
    const calibrated = calibrateMealAnalysis({
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Chicken coconut curry with rice',
      mealCategory: 'mixed_plate',
      portionSize: 'standard',
      confidence: 'medium',
      uncertaintyReasons: ['rice_hidden_under_sauce'],
      hiddenCalorieRisks: ['coconut milk sauce', 'rice hidden'],
      items: [
        {
          name: 'Chicken curry sauce over rice',
          canonicalFoodName: 'chicken coconut curry rice',
          estimatedQuantity: 420,
          unit: 'g',
          calories: 620,
          proteinG: 32,
          carbsG: 70,
          fatG: 26,
          fiberG: 5,
          confidence: 'medium',
        },
      ],
    });

    expect(calibrated.caloriesEstimate).toBe(900);
    expect(calibrated.carbsG).toBe(100);
    expect(calibrated.fatG).toBe(42);
    expect(calibrated.confidence).toBe('low');
  });

  it('stabilizes lasagna portions when identical scans switch between small and standard tray names', () => {
    function variant(name: string, pastaGrams: number): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName: name,
        mealCategory: 'pasta',
        portionSize: 'standard',
        confidence: 'medium',
        uncertaintyReasons: ['tray_depth_estimated'],
        hiddenCalorieRisks: ['cheese', 'cream sauce'],
        items: [
          {
            name,
            canonicalFoodName: 'baked pasta with cheese sauce',
            estimatedQuantity: pastaGrams,
            unit: 'g',
            calories: pastaGrams * 1.58,
            proteinG: pastaGrams * 0.058,
            carbsG: pastaGrams * 0.309,
            fatG: pastaGrams * 0.009,
            fiberG: pastaGrams * 0.018,
            confidence: 'medium',
          },
        ],
      };
    }

    const lowerEstimate = calibrateMealAnalysis(variant('Small baked pasta with cheese sauce and breadstick', 260));
    const higherEstimate = calibrateMealAnalysis(variant('Baked pasta with cheese sauce and breadstick', 360));

    expect(Math.abs(lowerEstimate.caloriesEstimate - higherEstimate.caloriesEstimate)).toBeLessThanOrEqual(10);
    expect(Math.abs(lowerEstimate.carbsG - higherEstimate.carbsG)).toBeLessThanOrEqual(2);
  });

  it('stabilizes spaghetti bolognese when scans alternate between bolognese and meat sauce wording', () => {
    function variant(mealName: string): RawMealAnalysis {
      return {
        isFoodPhoto: true,
        nonFoodReason: '',
        mealName,
        mealCategory: 'pasta',
        portionSize: 'standard',
        confidence: 'medium',
        uncertaintyReasons: ['sauce_and_cheese_portion_estimated'],
        hiddenCalorieRisks: ['oil', 'cheese'],
        items: [
          {
            name: mealName,
            canonicalFoodName: 'spaghetti with meat sauce and shredded cheese',
            estimatedQuantity: 360,
            unit: 'g',
            calories: 720,
            proteinG: 50,
            carbsG: 58,
            fatG: 30,
            fiberG: 4,
            confidence: 'medium',
          },
        ],
      };
    }

    const meatSauce = calibrateMealAnalysis(variant('Spaghetti with meat sauce and shredded cheese'));
    const bolognese = calibrateMealAnalysis(variant('Spaghetti Bolognese with Cheese'));

    expect(meatSauce.caloriesEstimate).toBe(760);
    expect(meatSauce).toMatchObject({
      caloriesEstimate: bolognese.caloriesEstimate,
      proteinG: bolognese.proteinG,
      carbsG: bolognese.carbsG,
      fatG: bolognese.fatG,
      fiberG: bolognese.fiberG,
      confidence: 'low',
    });
  });

  it('stabilizes lasagna-style pasta trays without requiring the exact baked pasta wording', () => {
    const calibrated = calibrateMealAnalysis({
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Pasta tray with cheese sauce and breadstick',
      mealCategory: 'pasta',
      portionSize: 'standard',
      confidence: 'medium',
      uncertaintyReasons: ['tray_depth_estimated'],
      hiddenCalorieRisks: ['cheese', 'cream sauce'],
      items: [
        {
          name: 'Pasta with cheese sauce and breadstick',
          canonicalFoodName: 'pasta with cheese sauce and breadstick',
          estimatedQuantity: 360,
          unit: 'g',
          calories: 650,
          proteinG: 34,
          carbsG: 95,
          fatG: 18,
          fiberG: 5,
          confidence: 'medium',
        },
      ],
    });

    expect(calibrated.caloriesEstimate).toBe(595);
    expect(calibrated.carbsG).toBe(59.5);
    expect(calibrated.confidence).toBe('low');
  });

  it('keeps baked pasta and baked dish wording on the same lasagna template', () => {
    const variants = ['Baked pasta with cheese and breadstick', 'Baked dish with cheese and breadstick'];

    for (const mealName of variants) {
      const calibrated = calibrateMealAnalysis(
        createSingleItemRaw({
          mealName,
          mealCategory: 'pasta',
          hiddenCalorieRisks: ['cheese sauce'],
          confidence: 'low',
        }),
      );

      expect(calibrated.caloriesEstimate).toBe(595);
      expect(calibrated.proteinG).toBe(28);
      expect(calibrated.carbsG).toBe(59.5);
      expect(calibrated.fatG).toBe(24.5);
      expect(calibrated.confidence).toBe('low');
    }
  });

  it('uses the granola yogurt template before the skyr banana fallback', () => {
    const calibrated = calibrateMealAnalysis(
      createSingleItemRaw({
        mealName: 'Yogurt fruit bowl with banana granola and berries',
        mealCategory: 'mixed_plate',
        hiddenCalorieRisks: ['granola density'],
        uncertaintyReasons: [],
      }),
    );

    expect(calibrated.caloriesEstimate).toBe(420);
    expect(calibrated.proteinG).toBe(24);
    expect(calibrated.carbsG).toBe(55);
    expect(calibrated.fatG).toBe(13);
    expect(calibrated.confidence).toBe('medium');
  });

  it('stabilizes variable bakery, sandwich, and packaged names used by benchmark photos', () => {
    const examples = [
      {
        raw: createSingleItemRaw({
          mealName: 'Ham sandwich with butter on baguette',
          mealCategory: 'sandwich',
          hiddenCalorieRisks: ['hidden butter'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 650, proteinG: 30, carbsG: 88, fatG: 24, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Sliced brioche loaf with chocolate spread',
          mealCategory: 'dessert',
          hiddenCalorieRisks: ['spread thickness'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 560, proteinG: 11, carbsG: 75, fatG: 26, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Chicken sandwich with lettuce tomato avocado',
          mealCategory: 'sandwich',
          hiddenCalorieRisks: ['sauce'],
        }),
        expected: { caloriesEstimate: 450, proteinG: 24, carbsG: 45, fatG: 18, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Three chocolate coated protein bars',
          mealCategory: 'packaged',
          hiddenCalorieRisks: ['product label not visible'],
        }),
        expected: { caloriesEstimate: 230, proteinG: 20, carbsG: 24, fatG: 8, confidence: 'low' },
      },
    ];

    for (const example of examples) {
      expect(calibrateMealAnalysis(example.raw)).toMatchObject(example.expected);
    }
  });

  it('stabilizes variable mixed meal names for chicken, salmon, lentil stew, pizza, and goat cheese salad', () => {
    const examples = [
      {
        raw: createSingleItemRaw({
          mealName: 'Chicken with green beans and rice',
          mealCategory: 'mixed_plate',
          hiddenCalorieRisks: ['cooking oil'],
        }),
        expected: { caloriesEstimate: 560, proteinG: 50, carbsG: 62, fatG: 14, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Salmon with quinoa and broccoli',
          mealCategory: 'mixed_plate',
          hiddenCalorieRisks: ['oil'],
        }),
        expected: { caloriesEstimate: 720, proteinG: 48, carbsG: 60, fatG: 35, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Bowl of chili lentil sausage stew',
          mealCategory: 'mixed_plate',
          hiddenCalorieRisks: ['oil'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 820, proteinG: 40, carbsG: 75, fatG: 38, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Pizza with ham mushrooms and cheese',
          mealCategory: 'mixed_plate',
          hiddenCalorieRisks: ['cheese amount'],
        }),
        expected: { caloriesEstimate: 880, proteinG: 38, carbsG: 105, fatG: 42, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Pad Thai chicken with chili sauce and rice noodles',
          mealCategory: 'mixed_plate',
          hiddenCalorieRisks: ['oil', 'peanuts'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 900, proteinG: 42, carbsG: 115, fatG: 38, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Goat cheese toast salad platter',
          mealCategory: 'salad',
          hiddenCalorieRisks: ['dressing', 'nuts'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 760, proteinG: 32, carbsG: 45, fatG: 55, confidence: 'low' },
      },
    ];

    for (const example of examples) {
      expect(calibrateMealAnalysis(example.raw)).toMatchObject(example.expected);
    }
  });

  it('stabilizes dessert and aperitif plates without borrowing unrelated savory templates', () => {
    const examples = [
      {
        raw: createSingleItemRaw({
          mealName: 'Lemon meringue tart slice',
          mealCategory: 'dessert',
          hiddenCalorieRisks: ['slice size'],
          uncertaintyReasons: [],
        }),
        expected: { caloriesEstimate: 450, proteinG: 6, carbsG: 65, fatG: 20, confidence: 'medium' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Crepe with Nutella and banana',
          mealCategory: 'dessert',
          hiddenCalorieRisks: ['spread amount'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 650, proteinG: 12, carbsG: 95, fatG: 24, confidence: 'low' },
      },
      {
        raw: createSingleItemRaw({
          mealName: 'Fromage pain vin aperitif dinatoire',
          mealCategory: 'mixed_plate',
          hiddenCalorieRisks: ['partial meal'],
          confidence: 'low',
        }),
        expected: { caloriesEstimate: 850, proteinG: 38, carbsG: 75, fatG: 58, confidence: 'low' },
      },
    ];

    for (const example of examples) {
      expect(calibrateMealAnalysis(example.raw)).toMatchObject(example.expected);
    }
  });

  it('does not apply the burger-fries template to steak and potato plates without burger or fries text', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Steak hache 5%, pommes de terre vapeur, salade',
      mealCategory: 'burger_fries',
      portionSize: 'standard',
      confidence: 'high',
      uncertaintyReasons: ['starch_portion_estimated'],
      hiddenCalorieRisks: ['salad dressing'],
      items: [
        {
          name: 'Steak hache',
          canonicalFoodName: 'lean beef patty',
          estimatedQuantity: 130,
          unit: 'g',
          calories: 325,
          proteinG: 34,
          carbsG: 0,
          fatG: 20,
          fiberG: 0,
          confidence: 'medium',
        },
        {
          name: 'Pommes de terre vapeur',
          canonicalFoodName: 'boiled potatoes',
          estimatedQuantity: 180,
          unit: 'g',
          calories: 157,
          proteinG: 3.4,
          carbsG: 36,
          fatG: 0.2,
          fiberG: 3.2,
          confidence: 'medium',
        },
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);

    expect(calibrated.caloriesEstimate).toBeGreaterThanOrEqual(520);
    expect(calibrated.caloriesEstimate).toBeLessThanOrEqual(760);
    expect(calibrated.carbsG).toBeGreaterThanOrEqual(45);
    expect(calibrated.carbsG).toBeLessThanOrEqual(80);
    expect(calibrated.fatG).toBeLessThanOrEqual(32);
  });

  it('downgrades confident-looking mixed meals when hidden calories are likely', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Pates bolognaise maison',
      mealCategory: 'pasta',
      portionSize: 'standard',
      confidence: 'high',
      uncertaintyReasons: [],
      hiddenCalorieRisks: ['cheese', 'sauce fat'],
      items: [
        {
          name: 'Tagliatelle pasta',
          canonicalFoodName: 'tagliatelle pasta',
          estimatedQuantity: 150,
          unit: 'g',
          calories: 237,
          proteinG: 8.7,
          carbsG: 46.3,
          fatG: 1.4,
          fiberG: 2,
          confidence: 'high',
        },
        {
          name: 'Ground beef Bolognese sauce',
          canonicalFoodName: 'ground beef Bolognese sauce',
          estimatedQuantity: 130,
          unit: 'g',
          calories: 325,
          proteinG: 33.8,
          carbsG: 0,
          fatG: 19.5,
          fiberG: 1.2,
          confidence: 'medium',
        },
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);

    expect(calibrated.confidence).toBe('low');
  });

  it.each([
    {
      mealName: 'Demi-baguette jambon beurre',
      category: 'sandwich' as const,
      expected: { calories: [520, 760], proteinG: [22, 38], carbsG: [70, 105], fatG: [18, 35] },
    },
    {
      mealName: 'Soupe legumes pain fromage',
      category: 'mixed_plate' as const,
      expected: { calories: [380, 650], proteinG: [15, 30], carbsG: [45, 80], fatG: [12, 34] },
    },
    {
      mealName: 'Couscous poulet legumes',
      category: 'mixed_plate' as const,
      expected: { calories: [700, 1050], proteinG: [35, 60], carbsG: [90, 145], fatG: [18, 42] },
    },
    {
      mealName: 'Pad Thai poulet',
      category: 'mixed_plate' as const,
      expected: { calories: [750, 1150], proteinG: [30, 55], carbsG: [90, 145], fatG: [25, 55] },
    },
    {
      mealName: 'Risotto champignons parmesan',
      category: 'mixed_plate' as const,
      expected: { calories: [650, 1000], proteinG: [18, 35], carbsG: [75, 120], fatG: [25, 55] },
    },
    {
      mealName: 'Bowl falafel houmous quinoa',
      category: 'salad' as const,
      expected: { calories: [700, 1050], proteinG: [22, 40], carbsG: [85, 135], fatG: [30, 60] },
    },
    {
      mealName: 'Taboule poulet avocat',
      category: 'salad' as const,
      expected: { calories: [560, 850], proteinG: [28, 48], carbsG: [55, 95], fatG: [22, 48] },
    },
    {
      mealName: 'Nicoise salade',
      category: 'salad' as const,
      expected: { calories: [520, 820], proteinG: [32, 52], carbsG: [35, 70], fatG: [24, 50] },
    },
    {
      mealName: 'Burrata tomates pesto',
      category: 'salad' as const,
      expected: { calories: [650, 980], proteinG: [22, 38], carbsG: [35, 75], fatG: [45, 75] },
    },
    {
      mealName: 'Raclette assiette',
      category: 'mixed_plate' as const,
      expected: { calories: [900, 1400], proteinG: [35, 65], carbsG: [50, 90], fatG: [60, 100] },
    },
  ])('calibrates known ambiguous dish template: $mealName', ({ mealName, category, expected }) => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName,
      mealCategory: category,
      portionSize: 'standard',
      confidence: 'high',
      uncertaintyReasons: [],
      hiddenCalorieRisks: ['portion depth', 'sauce or oil'],
      items: [
        {
          name: mealName,
          canonicalFoodName: mealName,
          estimatedQuantity: 100,
          unit: 'g',
          calories: 120,
          proteinG: 5,
          carbsG: 10,
          fatG: 4,
          fiberG: 2,
          confidence: 'high',
        },
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);

    expect(calibrated.caloriesEstimate).toBeGreaterThanOrEqual(expected.calories[0]);
    expect(calibrated.caloriesEstimate).toBeLessThanOrEqual(expected.calories[1]);
    expect(calibrated.proteinG).toBeGreaterThanOrEqual(expected.proteinG[0]);
    expect(calibrated.proteinG).toBeLessThanOrEqual(expected.proteinG[1]);
    expect(calibrated.carbsG).toBeGreaterThanOrEqual(expected.carbsG[0]);
    expect(calibrated.carbsG).toBeLessThanOrEqual(expected.carbsG[1]);
    expect(calibrated.fatG).toBeGreaterThanOrEqual(expected.fatG[0]);
    expect(calibrated.fatG).toBeLessThanOrEqual(expected.fatG[1]);
    expect(calibrated.confidence).toBe('low');
    expect(calibrated.uncertaintyReasons).toContain('known_dish_template_applied');
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
