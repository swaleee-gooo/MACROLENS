import { describe, expect, it } from 'vitest';
import { handleAnalyzeMealRequest } from './handler.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function foodAnalysis(): RawMealAnalysis {
  return {
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
}

describe('handleAnalyzeMealRequest', () => {
  it('derives meal userId from the authorization JWT instead of the request body', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg', userId: 'spoofed-user' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => foodAnalysis(),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meal.userId).toBe('jwt-user');
  });

  it('returns a typed non-food error without creating a meal response', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/not-food.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => ({
          isFoodPhoto: false,
          nonFoodReason: 'The image shows a desk.',
          mealName: '',
          mealCategory: 'unknown',
          portionSize: 'unknown',
          confidence: 'low',
          uncertaintyReasons: ['no_food_visible'],
          hiddenCalorieRisks: [],
          items: [],
        }),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: 'non_food_photo',
      message: 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.',
    });
  });

  it('rejects missing authorization before analysis', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => foodAnalysis(),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'missing_or_invalid_authorization' });
  });
});
