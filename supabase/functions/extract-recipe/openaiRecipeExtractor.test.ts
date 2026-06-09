import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractRecipeWithOpenAI } from './openaiRecipeExtractor.ts';

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

function openAiJson(raw: unknown): Response {
  return {
    ok: true,
    json: async () => ({ output_text: JSON.stringify(raw) }),
  } as Response;
}

function jsonResponse(raw: unknown): Response {
  return {
    ok: true,
    json: async () => raw,
  } as Response;
}

function redirectResponse(url: string): Response {
  return {
    ok: true,
    url,
    body: {
      cancel: async () => undefined,
    },
  } as unknown as Response;
}

describe('extractRecipeWithOpenAI', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves short TikTok links before calling TikTok oEmbed', async () => {
    const canonicalUrl = 'https://www.tiktok.com/@chef/video/1234567890';
    const fetchMock = vi.fn(async (input: FetchInput, init?: FetchInit) => {
      const url = String(input);

      if (url === 'https://vm.tiktok.com/ZGabc/') {
        expect(init?.redirect).toBe('follow');
        return redirectResponse(canonicalUrl);
      }

      if (url.startsWith('https://www.tiktok.com/oembed')) {
        expect(url).toBe(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`);
        return jsonResponse({
          title: 'Poulet teriyaki viral',
          author_name: '@chef',
          thumbnail_url: 'https://cdn.example/thumb.jpg',
        });
      }

      if (url === 'https://api.openai.com/v1/responses') {
        return openAiJson({
          recipeFound: true,
          title: '',
          summary: 'Bol riche en proteines.',
          servings: 2,
          statedCaloriesPerServing: 520,
          ingredients: [
            { name: 'Poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
          ],
          steps: ['Cuire le poulet'],
        });
      }

      throw new Error(`unexpected_fetch_${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await extractRecipeWithOpenAI('https://vm.tiktok.com/ZGabc/', 'openai-key');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') {
      throw new Error('unexpected_extraction_status');
    }

    const openAiCall = fetchMock.mock.calls.find(([input]) => String(input) === 'https://api.openai.com/v1/responses');
    const body = JSON.parse(String(openAiCall?.[1]?.body));
    expect(body.input[1].content[0].text).toContain(`Source URL: ${canonicalUrl}`);

    expect(result.recipe).toMatchObject({
      title: 'Poulet teriyaki viral',
      sourceUrl: 'https://vm.tiktok.com/ZGabc/',
      sourcePlatform: 'tiktok',
      sourceAuthor: '@chef',
      imageUrl: 'https://cdn.example/thumb.jpg',
      statedCaloriesPerServing: 520,
    });
  });

  it('returns no_recipe when all model ingredients have invalid grams', async () => {
    const fetchMock = vi.fn(async (input: FetchInput) => {
      const url = String(input);

      if (url === 'https://example.com/post') {
        return {
          ok: true,
          text: async () => '<html><head><meta property="og:title" content="Post social"></head></html>',
        } as Response;
      }

      if (url === 'https://api.openai.com/v1/responses') {
        return openAiJson({
          recipeFound: true,
          title: 'Post social',
          summary: '',
          servings: 1,
          ingredients: [
            { name: 'Ingredient sans poids', grams: 0, kcalPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fatPer100g: 1 },
          ],
          steps: [''],
        });
      }

      throw new Error(`unexpected_fetch_${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(extractRecipeWithOpenAI('https://example.com/post', 'openai-key')).resolves.toEqual({ status: 'no_recipe' });
  });
});
