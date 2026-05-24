import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeMealWithOpenAI, type RawMealAnalysis } from './openaiMealAnalyzer.ts';

const rawFoodAnalysis: RawMealAnalysis = {
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

describe('analyzeMealWithOpenAI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests low-temperature structured analysis to reduce repeat-scan variance', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: JSON.stringify(rawFoodAnalysis) }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await analyzeMealWithOpenAI('https://cdn.example/meal.jpg', 'openai-key');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));

    expect(body.temperature).toBeLessThanOrEqual(0.2);
    expect(body.input[0].content[1]).toEqual({
      type: 'input_image',
      image_url: 'https://cdn.example/meal.jpg',
    });
  });
});
