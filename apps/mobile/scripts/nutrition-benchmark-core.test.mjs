import { describe, expect, it } from 'vitest';
import { scoreNutritionCase, scoreNutritionError, summarizeNutritionBenchmark } from './nutrition-benchmark-core.mjs';

const croissantCase = {
  id: 'ML-001',
  category: 'Breakfast',
  meal: 'Croissant beurre + cafe noir',
  expected: {
    calories: [220, 330],
    proteinG: [4, 8],
    carbsG: [25, 38],
    fatG: [11, 20],
    fiberG: [1, 3],
  },
  expectedConfidence: 'medium',
  failureModes: ['bakery size', 'butter content'],
  usefulCorrections: ['portion up/down'],
};

function response(overrides = {}) {
  return {
    meal: {
      caloriesEstimate: 280,
      proteinG: 6,
      carbsG: 34,
      fatG: 15,
      fiberG: 2,
      confidence: 'medium',
      source: 'estimated',
      ...overrides.meal,
    },
    correctionSuggestions: [{ correctionType: 'portion_up', label: 'Portion +15%' }],
    ...overrides,
  };
}

describe('nutrition benchmark scoring', () => {
  it('awards 100 points for a calibrated estimate inside every expected range', () => {
    const result = scoreNutritionCase(croissantCase, response());

    expect(result.totalScore).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.points).toMatchObject({
      calories: 30,
      protein: 20,
      carbs: 10,
      fat: 10,
      confidence: 15,
      corrections: 10,
      source: 5,
    });
  });

  it('keeps partial credit for near misses but records failed dimensions', () => {
    const result = scoreNutritionCase(
      croissantCase,
      response({
        meal: {
          caloriesEstimate: 360,
          proteinG: 9.2,
          carbsG: 50,
          fatG: 15,
          fiberG: 2,
          confidence: 'high',
          source: 'estimated',
        },
      }),
    );

    expect(result.points.calories).toBe(15);
    expect(result.points.protein).toBe(10);
    expect(result.points.confidence).toBe(8);
    expect(result.failedDimensions).toEqual(['carbs']);
  });

  it('blocks public accuracy claims until all 50 nutrition cases have executed', () => {
    const scores = Array.from({ length: 49 }, (_, index) => ({
      ...scoreNutritionCase(croissantCase, response()),
      id: `ML-${String(index + 1).padStart(3, '0')}`,
      category: index === 0 ? 'Hard Case' : 'Breakfast',
    }));

    const summary = summarizeNutritionBenchmark(scores);

    expect(summary.executedCases).toBe(49);
    expect(summary.accuracyClaimAllowed).toBe(false);
    expect(summary.releaseFailures).toContain('nutrition_requires_50_executed_cases');
  });

  it('blocks public accuracy claims when hard-case averages are below the release floor', () => {
    const strong = scoreNutritionCase(croissantCase, response());
    const weakHardCase = {
      ...scoreNutritionCase(
        croissantCase,
        response({
          meal: {
            caloriesEstimate: 900,
            proteinG: 2,
            carbsG: 80,
            fatG: 40,
            fiberG: 0,
            confidence: 'high',
            source: 'estimated',
          },
          correctionSuggestions: [],
        }),
      ),
      category: 'Hard Case',
    };
    const scores = Array.from({ length: 50 }, (_, index) => ({
      ...(index === 49 ? weakHardCase : strong),
      id: `ML-${String(index + 1).padStart(3, '0')}`,
      category: index === 49 ? 'Hard Case' : 'Breakfast',
    }));

    const summary = summarizeNutritionBenchmark(scores);

    expect(summary.executedCases).toBe(50);
    expect(summary.accuracyClaimAllowed).toBe(false);
    expect(summary.releaseFailures).toContain('nutrition_hard_case_average_below_65');
  });

  it('keeps executed cases in the report when an analysis call returns an error', () => {
    const scores = Array.from({ length: 50 }, (_, index) => ({
      ...scoreNutritionCase(croissantCase, response()),
      id: `ML-${String(index + 1).padStart(3, '0')}`,
      category: index === 49 ? 'Hard Case' : 'Breakfast',
    }));
    scores[48] = scoreNutritionError(croissantCase, {
      status: 422,
      code: 'non_food_photo',
      message: 'No food detected',
    });

    const summary = summarizeNutritionBenchmark(scores);

    expect(summary.executedCases).toBe(50);
    expect(summary.accuracyClaimAllowed).toBe(false);
    expect(summary.releaseFailures).toContain('nutrition_case_errors_present');
  });
});
