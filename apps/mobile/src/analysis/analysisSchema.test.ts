import { describe, expect, it } from 'vitest';
import { analysisResultSchema } from './analysisSchema';

const baseMeal = {
  id: 'meal-1',
  userId: 'user-1',
  imageUri: 'https://cdn.example/meal.jpg',
  capturedAt: '2026-06-04T10:00:00.000Z',
  mealName: 'Poke bowl',
  caloriesEstimate: 680,
  caloriesLow: 420,
  caloriesHigh: 980,
  proteinG: 35,
  carbsG: 82,
  fatG: 28,
  fiberG: 9,
  confidence: 'low',
  notes: 'Estimated by AI vision.',
  source: 'estimated',
  items: [
    {
      id: 'meal-1-item-1',
      mealId: 'meal-1',
      name: 'Poke bowl',
      canonicalFoodName: 'salmon poke bowl',
      estimatedQuantity: 240,
      quantityGrams: { p10: 160, p50: 240, p90: 360 },
      calorieQuantiles: { p10: 420, p50: 680, p90: 980 },
      unit: 'g',
      calories: 680,
      proteinG: 35,
      carbsG: 82,
      fatG: 28,
      fiberG: 9,
      confidence: 'low',
      dataSource: 'estimated',
      sourceFoodId: null,
      hiddenCalorieRisks: [
        {
          type: 'hidden_base',
          targetItemId: 'meal-1-item-1',
          description: 'Rice may be hidden under toppings.',
          kcalImpact: { p10: 80, p50: 180, p90: 320, unit: 'kcal', method: 'risk_model' },
          evidence: ['deep bowl'],
          answerableQuestion: 'Was there rice under the toppings?',
        },
      ],
    },
  ],
  scene: {
    id: 'scene-1',
    parserVersion: 'food-scene-v1',
    modelId: 'openai:gpt-4.1-mini',
    imageInputs: [{ uri: 'https://cdn.example/meal.jpg', role: 'primary' }],
    visualQuality: 'usable',
    portionAmbiguity: 'high',
    evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
    items: [
      {
        id: 'meal-1-item-1',
        label: 'Poke bowl',
        canonicalFoodName: 'salmon poke bowl',
        role: 'starch',
        visualEvidence: ['deep bowl'],
        grams: { p10: 160, p50: 240, p90: 360, unit: 'g', method: 'model_range' },
        kcal: { p10: 420, p50: 680, p90: 980, unit: 'kcal', method: 'model_range' },
        confidence: 'low',
        dataSource: 'estimated',
        sourceFoodId: null,
        hiddenCalorieRisks: [],
      },
    ],
    hiddenCalorieRisks: [],
    uncertaintyDrivers: ['hidden_base'],
    candidateMeals: [],
  },
};

describe('analysisResultSchema FoodScene metadata', () => {
  it('preserves optional quantiles, hidden risks, and scene metadata', () => {
    const parsed = analysisResultSchema.parse({
      meal: baseMeal,
      uncertaintyReasons: ['hidden_base'],
      correctionSuggestions: [],
    });

    expect(parsed.meal.items[0].quantityGrams).toEqual({ p10: 160, p50: 240, p90: 360 });
    expect(parsed.meal.items[0].calorieQuantiles?.p90).toBe(980);
    expect(parsed.meal.items[0].hiddenCalorieRisks?.[0].type).toBe('hidden_base');
    expect(parsed.meal.scene?.items[0].grams.p50).toBe(240);
  });

  it('continues to accept old meal payloads without scene metadata', () => {
    const legacyMeal = {
      ...baseMeal,
      items: baseMeal.items.map(({ quantityGrams: _quantityGrams, calorieQuantiles: _calorieQuantiles, hiddenCalorieRisks: _hiddenCalorieRisks, ...item }) => item),
      scene: undefined,
    };

    expect(() =>
      analysisResultSchema.parse({
        meal: legacyMeal,
        uncertaintyReasons: [],
        correctionSuggestions: [],
      }),
    ).not.toThrow();
  });
});
