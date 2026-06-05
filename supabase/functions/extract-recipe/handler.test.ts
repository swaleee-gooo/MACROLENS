import { describe, expect, it } from 'vitest';
import { handleExtractRecipeRequest } from './handler.ts';
import type { RecipeExtractionResult } from './openaiRecipeExtractor.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function request(body: unknown, withAuth = true): Request {
  return new Request('https://example.test/extract-recipe', {
    method: 'POST',
    headers: withAuth ? { authorization: `Bearer ${fakeJwt('jwt-user')}` } : {},
    body: JSON.stringify(body),
  });
}

function okResult(): RecipeExtractionResult {
  return {
    status: 'ok',
    recipe: {
      title: 'Bol de poulet teriyaki',
      summary: 'Bol viral',
      sourceUrl: 'https://vm.tiktok.com/ZGabc/',
      sourcePlatform: 'tiktok',
      sourceAuthor: '@chef',
      imageUrl: 'https://cdn.example/thumb.jpg',
      servings: 2,
      ingredients: [{ name: 'Poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 }],
      steps: ['Cuire le poulet'],
    },
  };
}

describe('handleExtractRecipeRequest', () => {
  it('rejects a request without authorization', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }, false), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => okResult(),
    });
    expect(response.status).toBe(401);
  });

  it('returns 400 when the url is missing', async () => {
    const response = await handleExtractRecipeRequest(request({}), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => okResult(),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'missing_url' });
  });

  it('returns 422 for a non-http url', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'ftp://example.com/x' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => okResult(),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).error).toBe('unsupported_recipe_url');
  });

  it('returns a mock recipe when no OpenAI key and no injected extractor', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }), {
      env: { get: () => undefined },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sourcePlatform).toBe('tiktok');
    expect(body.ingredients.length).toBeGreaterThan(0);
  });

  it('returns the extracted recipe on success', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => okResult(),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.title).toBe('Bol de poulet teriyaki');
    expect(body.sourceAuthor).toBe('@chef');
  });

  it('filters invalid ingredient grams and empty steps before returning a recipe', async () => {
    const invalidRecipe = okResult();
    if (invalidRecipe.status !== 'ok') {
      throw new Error('unexpected_test_fixture');
    }

    invalidRecipe.recipe = {
      ...invalidRecipe.recipe,
      title: '  Bol viral  ',
      summary: '  Recette sociale  ',
      sourceAuthor: '  @chef  ',
      imageUrl: 'not-a-url',
      servings: 0,
      ingredients: [
        { name: 'Zero', grams: 0, kcalPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fatPer100g: 1 },
        { name: 'Negative', grams: -10, kcalPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fatPer100g: 1 },
        { name: '  Poulet  ', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      ],
      steps: ['  Cuire le poulet  ', '', '   ', 'Servir'],
    };

    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => invalidRecipe,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.title).toBe('Bol viral');
    expect(body.summary).toBe('Recette sociale');
    expect(body.sourceUrl).toBe('https://vm.tiktok.com/ZGabc/');
    expect(body.sourceAuthor).toBe('@chef');
    expect(body.imageUrl).toBeNull();
    expect(body.servings).toBe(1);
    expect(body.ingredients).toEqual([
      { name: 'Poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
    ]);
    expect(body.steps).toEqual(['Cuire le poulet', 'Servir']);
  });

  it('returns 502 when guardrails remove every ingredient', async () => {
    const invalidRecipe = okResult();
    if (invalidRecipe.status !== 'ok') {
      throw new Error('unexpected_test_fixture');
    }

    invalidRecipe.recipe.ingredients = [
      { name: 'Zero', grams: 0, kcalPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fatPer100g: 1 },
    ];

    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => invalidRecipe,
    });

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe('extraction_failed');
  });

  it('maps a no_recipe result to a 502 extraction_failed error', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => ({ status: 'no_recipe' }),
    });
    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe('extraction_failed');
  });

  it('maps an unsupported result to a 422 error', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'https://example.com/x' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => ({ status: 'unsupported' }),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).error).toBe('unsupported_recipe_url');
  });

  it('maps a thrown extractor error to a 502 error', async () => {
    const response = await handleExtractRecipeRequest(request({ url: 'https://vm.tiktok.com/ZGabc/' }), {
      env: { get: () => 'openai-key' },
      extractRecipe: async () => {
        throw new Error('openai_request_failed_500');
      },
    });
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('extraction_failed');
    expect(body.message).toBe("Le service d'extraction est temporairement indisponible. Reessaie dans quelques instants.");
  });
});
