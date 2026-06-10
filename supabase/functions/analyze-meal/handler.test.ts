import { describe, expect, it, vi } from 'vitest';
import { handleAnalyzeMealRequest } from './handler.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
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
    expect(body.correctionSuggestions.map((item: { correctionType: string }) => item.correctionType)).toContain('portion_half');
  });

  it('uses the model router when Gemini is configured without an OpenAI key', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg' }),
      }),
      {
        env: {
          get: (name) => {
            const values: Record<string, string> = {
              MEAL_ANALYSIS_PROVIDER: 'gemini',
              GEMINI_API_KEY: 'gemini-key',
            };
            return values[name];
          },
        },
        analyzeMealWithRouter: async () => ({
          raw: foodAnalysis(),
          provider: 'gemini',
          providerAttempts: [{ provider: 'gemini', ok: true, confidence: 'high', latencyMs: 12, costEstimateUsd: 0.0015 }],
          visionSignals: { status: 'disabled' },
        }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meal.userId).toBe('jwt-user');
  });

  it('returns scan review metadata when OpenAI asks a single follow-up question', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/ambiguous-meal.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => ({
          ...foodAnalysis(),
          confidence: 'low',
          scanRoute: 'meal',
          visualQuality: 'usable',
          portionAmbiguity: 'high',
          needsUserQuestion: true,
          followUpQuestion: 'Was there rice hidden under the chicken?',
          candidateMeals: [
            {
              name: 'Chicken rice plate',
              reason: 'Chicken is visible and rice may be hidden under it.',
              confidence: 'medium',
            },
          ],
        }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.scanReview).toEqual({
      scanRoute: 'meal',
      visualQuality: 'usable',
      portionAmbiguity: 'high',
      needsUserQuestion: true,
      followUpQuestion: 'Was there rice hidden under the chicken?',
      candidateMeals: [
        {
          name: 'Chicken rice plate',
          reason: 'Chicken is visible and rice may be hidden under it.',
          confidence: 'medium',
        },
      ],
    });
  });

  it('preserves item quantity quantiles and item-level hidden calorie risks in the meal response', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/poke.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () =>
          ({
            ...foodAnalysis(),
            mealName: 'Poke bowl',
            confidence: 'low',
            visualQuality: 'usable',
            portionAmbiguity: 'high',
            hiddenCalorieRisks: ['hidden rice base'],
            items: [
              {
                name: 'Poke bowl',
                canonicalFoodName: 'salmon poke bowl',
                estimatedQuantity: 240,
                quantityLow: 160,
                quantityHigh: 360,
                quantityP10: 160,
                quantityP50: 240,
                quantityP90: 360,
                unit: 'g',
                calories: 680,
                calorieP10: 420,
                calorieP50: 680,
                calorieP90: 980,
                proteinG: 35,
                carbsG: 82,
                fatG: 28,
                fiberG: 9,
                confidence: 'low',
                portionConfidence: 'low',
                role: 'starch',
                visualEvidence: ['deep bowl', 'toppings cover the base'],
                hiddenCalorieRisks: [
                  {
                    type: 'hidden_base',
                    description: 'Rice may be hidden under toppings.',
                    kcalImpactP10: 80,
                    kcalImpactP50: 180,
                    kcalImpactP90: 320,
                    evidence: ['deep bowl'],
                    answerableQuestion: 'Was there rice under the toppings?',
                  },
                ],
              },
            ],
          }) as RawMealAnalysis,
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.meal.items[0].estimatedQuantity).toBe(240);
    expect(body.meal.items[0].quantityGrams).toEqual({ p10: 160, p50: 240, p90: 360 });
    expect(body.meal.items[0].calorieQuantiles).toEqual({
      p10: body.meal.caloriesLow,
      p50: body.meal.items[0].calories,
      p90: body.meal.caloriesHigh,
    });
    expect(body.meal.items[0].hiddenCalorieRisks[0].kcalImpact.p90).toBe(320);
    expect(body.meal.scene.items[0].grams.p50).toBe(240);
  });

  it('realigns item calorie quantiles when backend calibration materially changes the raw item estimate', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/spaghetti.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () =>
          ({
            ...foodAnalysis(),
            mealName: 'Spaghetti with meat sauce',
            mealCategory: 'pasta',
            confidence: 'medium',
            uncertaintyReasons: ['sauce_and_cheese_portion_estimated'],
            hiddenCalorieRisks: ['sauce fat', 'cheese'],
            items: [
              {
                name: 'Spaghetti with meat sauce',
                canonicalFoodName: 'spaghetti with meat sauce',
                estimatedQuantity: 180,
                quantityLow: 150,
                quantityHigh: 210,
                quantityP10: 150,
                quantityP50: 180,
                quantityP90: 210,
                unit: 'g',
                calories: 270,
                calorieP10: 225,
                calorieP50: 270,
                calorieP90: 315,
                proteinG: 14,
                carbsG: 48,
                fatG: 6,
                fiberG: 3,
                confidence: 'medium',
                portionConfidence: 'medium',
                role: 'starch',
                visualEvidence: ['spaghetti visible', 'meat sauce visible'],
                hiddenCalorieRisks: [],
              },
            ],
          }) as RawMealAnalysis,
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.meal.caloriesEstimate).toBe(760);
    expect(body.meal.items[0].calories).toBe(760);
    expect(body.meal.items[0].calorieQuantiles).toEqual({
      p10: body.meal.caloriesLow,
      p50: 760,
      p90: body.meal.caloriesHigh,
    });
    expect(body.meal.items[0].calorieQuantiles.p50).not.toBe(270);
  });

  it('uses the deterministic highest-impact risk question instead of the raw model follow-up', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/poke.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () =>
          ({
            ...foodAnalysis(),
            confidence: 'low',
            visualQuality: 'usable',
            portionAmbiguity: 'high',
            needsUserQuestion: true,
            followUpQuestion: 'How big was the bowl?',
            hiddenCalorieRisks: ['hidden rice base', 'sauce'],
            items: [
              {
                ...foodAnalysis().items[0],
                name: 'Poke bowl',
                canonicalFoodName: 'salmon poke bowl',
                estimatedQuantity: 240,
                quantityLow: 160,
                quantityHigh: 360,
                calories: 680,
                portionConfidence: 'low',
                role: 'starch',
                visualEvidence: ['deep bowl'],
                hiddenCalorieRisks: [
                  {
                    type: 'sauce',
                    description: 'Sauce amount is unclear.',
                    kcalImpactP10: 30,
                    kcalImpactP50: 90,
                    kcalImpactP90: 180,
                    evidence: ['glossy toppings'],
                    answerableQuestion: 'Was there creamy sauce or dressing?',
                  },
                  {
                    type: 'hidden_base',
                    description: 'Rice may be hidden under toppings.',
                    kcalImpactP10: 80,
                    kcalImpactP50: 180,
                    kcalImpactP90: 320,
                    evidence: ['deep bowl'],
                    answerableQuestion: 'Was there rice under the toppings?',
                  },
                ],
              },
            ],
          }) as RawMealAnalysis,
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.scanReview.followUpQuestion).toBe('Was there rice under the toppings?');
    expect(body.scanReview.needsUserQuestion).toBe(true);
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

  it('returns 429 with retryAfterSeconds when the hourly quota is exceeded', async () => {
    const analyzeMeal = vi.fn(async () => foodAnalysis());
    const checkRateLimit = vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 1504 }));

    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        checkRateLimit,
        analyzeMeal,
      },
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: 'rate_limited', retryAfterSeconds: 1504 });
    expect(checkRateLimit).toHaveBeenCalledWith('jwt-user');
    expect(analyzeMeal).not.toHaveBeenCalled();
  });

  it('analyzes normally when the rate limiter allows the request', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        checkRateLimit: async () => ({ allowed: true as const }),
        analyzeMeal: async () => foodAnalysis(),
      },
    );

    expect(response.status).toBe(200);
  });

  it('rejects an expired JWT with 401', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'jwt-user', exp: Math.floor(Date.now() / 1000) - 60 })).toString('base64url');

    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${header}.${payload}.signature` },
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
