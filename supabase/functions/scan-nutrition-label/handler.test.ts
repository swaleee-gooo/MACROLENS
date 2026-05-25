import { describe, expect, it } from 'vitest';
import { handleScanNutritionLabelRequest } from './handler.ts';
import type { RawNutritionLabelOcr } from './openaiNutritionLabelOcr.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function readableLabel(): RawNutritionLabelOcr {
  return {
    isNutritionLabel: true,
    productName: 'Yaourt grec',
    servingSizeText: '125 g',
    servingGrams: 125,
    caloriesPer100g: 92.2,
    proteinPer100g: 9.84,
    carbsPer100g: 3.5,
    fatPer100g: 4.1,
    fiberPer100g: null,
    confidence: 'high',
    missingFields: [],
  };
}

describe('handleScanNutritionLabelRequest', () => {
  it('requires an authenticated Supabase user', async () => {
    const response = await handleScanNutritionLabelRequest(
      new Request('https://example.test/scan-nutrition-label', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://cdn.example/label.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        scanLabel: async () => readableLabel(),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'missing_or_invalid_authorization' });
  });

  it('converts a readable nutrition label into packaged food macros per 100g', async () => {
    const response = await handleScanNutritionLabelRequest(
      new Request('https://example.test/scan-nutrition-label', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('user-1')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/label.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        scanLabel: async () => readableLabel(),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.item).toMatchObject({
      name: 'Yaourt grec',
      caloriesPer100g: 92,
      proteinPer100g: 9.8,
      carbsPer100g: 3.5,
      fatPer100g: 4.1,
      fiberPer100g: 0,
      source: 'nutrition_label_ocr',
    });
    expect(body.item.barcode).toMatch(/^label-/);
    expect(body.servingGrams).toBe(125);
    expect(body.confidence).toBe('high');
  });

  it('returns a typed error when the label cannot be read', async () => {
    const response = await handleScanNutritionLabelRequest(
      new Request('https://example.test/scan-nutrition-label', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('user-1')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/not-label.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        scanLabel: async () => ({
          ...readableLabel(),
          isNutritionLabel: false,
          caloriesPer100g: null,
          proteinPer100g: null,
          carbsPer100g: null,
          fatPer100g: null,
          confidence: 'low',
          missingFields: ['caloriesPer100g'],
        }),
      },
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('nutrition_label_not_found');
  });
});
