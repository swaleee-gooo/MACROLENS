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

  it('requests deterministic structured analysis to reduce repeat-scan variance', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: JSON.stringify(rawFoodAnalysis) }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await analyzeMealWithOpenAI('https://cdn.example/meal.jpg', 'openai-key');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));

    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(body.temperature).toBe(0);
    expect(body.input[0].content[0].text).toContain('For repeat scans of the exact same image');
    expect(body.input[0].content[0].text).toContain('scanRoute');
    expect(body.input[0].content[1]).toEqual({
      type: 'input_image',
      image_url: 'https://cdn.example/meal.jpg',
      detail: 'high',
    });
    expect(body.text.format.schema.required).toContain('visualQuality');
    expect(body.text.format.schema.required).toContain('portionAmbiguity');
    expect(body.text.format.schema.properties.items.items.required).toContain('quantityP10');
    expect(body.text.format.schema.properties.items.items.required).toContain('calorieP90');
    expect(body.text.format.schema.properties.items.items.required).toContain('hiddenCalorieRisks');
    expect(body.text.format.schema.properties.items.items.required).toContain('visualEvidence');
  });
});
