import { describe, expect, it, vi } from 'vitest';
import { analyzeMealWithModelRouter } from './modelRouter.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function env(values: Record<string, string | undefined>) {
  return {
    get: (name: string) => values[name],
  };
}

function rawMeal(overrides: Partial<RawMealAnalysis> = {}): RawMealAnalysis {
  return {
    isFoodPhoto: true,
    nonFoodReason: '',
    mealName: 'Provider meal',
    mealCategory: 'unknown',
    portionSize: 'standard',
    confidence: 'medium',
    uncertaintyReasons: [],
    hiddenCalorieRisks: [],
    items: [
      {
        name: 'Rice',
        canonicalFoodName: 'rice cooked',
        estimatedQuantity: 180,
        unit: 'g',
        calories: 234,
        proteinG: 4,
        carbsG: 50,
        fatG: 1,
        fiberG: 1,
        confidence: 'medium',
      },
    ],
    ...overrides,
  };
}

describe('analyzeMealWithModelRouter', () => {
  it('uses the configured default provider for normal confidence', async () => {
    const openai = vi.fn(async () => rawMeal({ mealName: 'OpenAI meal', confidence: 'medium' }));
    const gemini = vi.fn(async () => rawMeal({ mealName: 'Gemini meal', confidence: 'high' }));

    const result = await analyzeMealWithModelRouter('https://cdn.example/meal.jpg', env({ MEAL_ANALYSIS_PROVIDER: 'openai', OPENAI_API_KEY: 'openai-key', GEMINI_API_KEY: 'gemini-key' }), {
      adapters: { openai, gemini },
    });

    expect(result.raw.mealName).toBe('OpenAI meal');
    expect(result.provider).toBe('openai');
    expect(gemini).not.toHaveBeenCalled();
    expect(result.providerAttempts).toEqual([expect.objectContaining({ provider: 'openai', ok: true })]);
  });

  it('escalates to the fallback provider when confidence is below threshold', async () => {
    const openai = vi.fn(async () => rawMeal({ mealName: 'Low confidence meal', confidence: 'low' }));
    const gemini = vi.fn(async () => rawMeal({ mealName: 'Fallback meal', confidence: 'high' }));

    const result = await analyzeMealWithModelRouter(
      'https://cdn.example/meal.jpg',
      env({
        MEAL_ANALYSIS_PROVIDER: 'openai',
        MEAL_ANALYSIS_FALLBACK_PROVIDER: 'gemini',
        MEAL_ANALYSIS_ESCALATION_THRESHOLD: '0.65',
        OPENAI_API_KEY: 'openai-key',
        GEMINI_API_KEY: 'gemini-key',
      }),
      { adapters: { openai, gemini } },
    );

    expect(result.raw.mealName).toBe('Fallback meal');
    expect(result.providerAttempts.map((attempt) => attempt.provider)).toEqual(['openai', 'gemini']);
    expect(result.providerAttempts).toHaveLength(2);
  });

  it('falls back after schema validation failure and records one attempt per provider', async () => {
    const openai = vi.fn(async () => ({ ...rawMeal(), items: [] }));
    const gemini = vi.fn(async () => rawMeal({ mealName: 'Valid fallback', confidence: 'high' }));

    const result = await analyzeMealWithModelRouter(
      'https://cdn.example/meal.jpg',
      env({
        MEAL_ANALYSIS_PROVIDER: 'openai',
        MEAL_ANALYSIS_FALLBACK_PROVIDER: 'gemini',
        OPENAI_API_KEY: 'openai-key',
        GEMINI_API_KEY: 'gemini-key',
      }),
      { adapters: { openai, gemini } },
    );

    expect(result.raw.mealName).toBe('Valid fallback');
    expect(result.providerAttempts).toEqual([
      expect.objectContaining({ provider: 'openai', ok: false, error: 'invalid_food_items' }),
      expect.objectContaining({ provider: 'gemini', ok: true, costEstimateUsd: expect.any(Number) }),
    ]);
  });

  it('keeps meal analysis when optional vision signals fail and adds a warning', async () => {
    const openai = vi.fn(async () => rawMeal({ confidence: 'medium' }));
    const result = await analyzeMealWithModelRouter(
      'https://cdn.example/meal.jpg',
      env({ MEAL_ANALYSIS_PROVIDER: 'openai', VISION_SIGNALS_PROVIDER: 'external', VISION_SIGNALS_URL: 'https://vision.example/signals', OPENAI_API_KEY: 'openai-key' }),
      {
        adapters: { openai },
        fetchVisionSignals: async () => {
          throw new Error('vision_down');
        },
      },
    );

    expect(result.raw.uncertaintyReasons).toContain('vision_signals_unavailable');
    expect(result.visionSignals).toEqual({ status: 'failed', warning: 'vision_down' });
  });
});
