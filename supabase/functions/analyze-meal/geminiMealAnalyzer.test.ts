import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeMealWithGemini } from './geminiMealAnalyzer.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

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

describe('analyzeMealWithGemini', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads image bytes and requests Gemini structured JSON in the shared raw schema', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target === 'https://cdn.example/meal.jpg') {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
      }

      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(rawFoodAnalysis) }] } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await analyzeMealWithGemini('https://cdn.example/meal.jpg', 'gemini-key');
    const geminiBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));

    expect(result).toEqual(rawFoodAnalysis);
    expect(String(fetchMock.mock.calls[1][0])).toContain('generativelanguage.googleapis.com');
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual(
      expect.objectContaining({
        'x-goog-api-key': 'gemini-key',
      }),
    );
    expect(geminiBody.contents[0].parts[0].inline_data).toEqual({ mime_type: 'image/jpeg', data: 'AQID' });
    expect(geminiBody.generationConfig.responseFormat.text.mimeType).toBe('application/json');
    expect(geminiBody.generationConfig.responseFormat.text.schema.required).toContain('items');
  });
});
