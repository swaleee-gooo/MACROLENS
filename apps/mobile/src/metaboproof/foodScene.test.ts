import { describe, expect, it } from 'vitest';
import { createFoodSceneItem, quantileEstimateFromRange } from './foodScene';

describe('FoodScene contract', () => {
  it('maps low, point, and high estimates into ordered p10/p50/p90 quantiles', () => {
    expect(
      quantileEstimateFromRange({
        low: 80,
        point: 120,
        high: 180,
        unit: 'g',
        method: 'model_range',
      }),
    ).toEqual({
      p10: 80,
      p50: 120,
      p90: 180,
      unit: 'g',
      method: 'model_range',
    });
  });

  it('keeps item-level hidden calorie risks with quantile kcal impact', () => {
    const item = createFoodSceneItem({
      id: 'meal-1-item-1',
      label: 'Poke bowl',
      canonicalFoodName: 'salmon poke bowl',
      role: 'starch',
      visualEvidence: ['deep bowl', 'toppings cover the base'],
      grams: { low: 160, point: 240, high: 360, unit: 'g', method: 'model_range' },
      kcal: { low: 420, point: 680, high: 980, unit: 'kcal', method: 'model_range' },
      confidence: 'low',
      dataSource: 'estimated',
      sourceFoodId: null,
      hiddenCalorieRisks: [
        {
          type: 'hidden_base',
          targetItemId: 'meal-1-item-1',
          description: 'Rice may be hidden under toppings.',
          kcalImpact: { p10: 80, p50: 180, p90: 320, unit: 'kcal', method: 'risk_model' },
          evidence: ['bowl depth is visible', 'rice base is mostly covered'],
          answerableQuestion: 'Was there rice under the toppings?',
        },
      ],
    });

    expect(item.quantityGrams).toEqual({ p10: 160, p50: 240, p90: 360 });
    expect(item.calorieQuantiles).toEqual({ p10: 420, p50: 680, p90: 980 });
    expect(item.hiddenCalorieRisks[0].kcalImpact.p90).toBe(320);
    expect(item.hiddenCalorieRisks[0].answerableQuestion).toBe('Was there rice under the toppings?');
  });
});
