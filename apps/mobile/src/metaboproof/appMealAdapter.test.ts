import { describe, expect, it } from 'vitest';
import { createAppMealFromMetaboProofAnalysis } from './appMealAdapter';
import type { MealAnalysis } from './types';

describe('createAppMealFromMetaboProofAnalysis', () => {
  it('maps MetaboProof totals and proof metadata into the existing Meal shape', () => {
    const analysis: MealAnalysis = {
      id: 'recipe-1',
      evidenceLevel: 'VERIFIED_RECIPE_WEIGHT',
      totalKcal: 248,
      totalProtein: 46.5,
      totalCarbs: 0,
      totalFat: 5.4,
      warnings: [],
      explanation: ['All ingredients use weighed recipe quantities and nutrition sources.'],
      items: [
        {
          id: 'chicken',
          label: 'Chicken breast',
          grams: 150,
          confidence: 1,
          evidenceLevel: 'VERIFIED_RECIPE_WEIGHT',
          source: {
            provider: 'USDA_FDC',
            externalId: '171077',
            name: 'Chicken breast cooked',
            kcalPer100g: 165,
            proteinPer100g: 31,
            carbsPer100g: 0,
            fatPer100g: 3.6,
          },
        },
      ],
    };

    const meal = createAppMealFromMetaboProofAnalysis({
      userId: 'local-user',
      mealName: 'Chicken prep',
      imageUri: 'recipe://verified',
      capturedAt: '2026-06-04T10:00:00.000Z',
      analysis,
    });

    expect(meal.caloriesEstimate).toBe(248);
    expect(meal.caloriesLow).toBe(248);
    expect(meal.items[0].dataSource).toBe('usda');
    expect(meal.proof?.status).toBe('verified');
    expect(meal.proof?.sources[0].provider).toBe('USDA_FDC');
  });
});
