import { getUserIdFromAuthorizationHeader } from './auth.ts';
import {
  detectPlatform,
  extractRecipeWithOpenAI,
  type ExtractedRecipe,
  type ExtractedRecipeIngredient,
  type RecipeExtractionResult,
} from './openaiRecipeExtractor.ts';

type ExtractRequest = {
  url?: unknown;
};

type HandlerDeps = {
  env: {
    get(name: string): string | undefined;
  };
  extractRecipe?: (url: string, openAiKey: string) => Promise<RecipeExtractionResult>;
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

const unsupportedUrlMessage = "Ce lien n'est pas exploitable. Colle un lien TikTok, Instagram, YouTube ou une page web accessible.";
const noRecipeMessage = "Je n'ai pas pu trouver de recette exploitable dans ce contenu. Essaie un post ou une page recette plus detaillee.";
const temporaryExtractionFailureMessage = "Le service d'extraction est temporairement indisponible. Reessaie dans quelques instants.";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableTrimmedString(value: unknown): string | null {
  const trimmed = trimmedString(value);
  return trimmed.length > 0 ? trimmed : null;
}

function httpImageUrl(value: unknown): string | null {
  const trimmed = trimmedString(value);
  return trimmed.length > 0 && isHttpUrl(trimmed) ? trimmed : null;
}

function normalizedIngredient(value: unknown): ExtractedRecipeIngredient | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const ingredient = value as Record<string, unknown>;
  const name = trimmedString(ingredient.name);
  const grams = typeof ingredient.grams === 'number' && Number.isFinite(ingredient.grams) ? ingredient.grams : 0;
  if (name.length === 0 || grams <= 0) {
    return null;
  }

  return {
    name,
    grams,
    kcalPer100g: nonNegativeNumber(ingredient.kcalPer100g),
    proteinPer100g: nonNegativeNumber(ingredient.proteinPer100g),
    carbsPer100g: nonNegativeNumber(ingredient.carbsPer100g),
    fatPer100g: nonNegativeNumber(ingredient.fatPer100g),
  };
}

function isExtractedRecipeIngredient(value: ExtractedRecipeIngredient | null): value is ExtractedRecipeIngredient {
  return value !== null;
}

function normalizedSteps(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((step) => trimmedString(step)).filter((step) => step.length > 0);
}

function normalizedServings(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function recipeResponse(recipe: ExtractedRecipe, requestedUrl: string): ExtractedRecipe | null {
  const rawIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const ingredients = rawIngredients.map((ingredient) => normalizedIngredient(ingredient)).filter(isExtractedRecipeIngredient);
  if (ingredients.length === 0) {
    return null;
  }

  return {
    title: trimmedString(recipe.title) || 'Recette importee',
    summary: trimmedString(recipe.summary),
    sourceUrl: requestedUrl,
    sourcePlatform: detectPlatform(requestedUrl),
    sourceAuthor: nullableTrimmedString(recipe.sourceAuthor),
    imageUrl: httpImageUrl(recipe.imageUrl),
    servings: normalizedServings(recipe.servings),
    ingredients,
    steps: normalizedSteps(recipe.steps),
  };
}

function mockRecipeResponse(url: string) {
  return recipeResponse({
    title: 'Bol de poulet teriyaki',
    summary: 'Reponse mock : OPENAI_API_KEY non configuree.',
    sourceUrl: url,
    sourcePlatform: detectPlatform(url),
    sourceAuthor: null,
    imageUrl: null,
    servings: 2,
    ingredients: [
      { name: 'Blanc de poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      { name: 'Riz cuit', grams: 400, kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
      { name: 'Sauce teriyaki', grams: 60, kcalPer100g: 130, proteinPer100g: 4, carbsPer100g: 28, fatPer100g: 0 },
    ],
    steps: ['Saisir le poulet', 'Glacer a la sauce teriyaki', 'Servir sur le riz'],
  }, url);
}

function extractionFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return noRecipeMessage;
  }

  if (error.message.startsWith('openai_request_failed_') || error.message === 'openai_missing_output_text') {
    return temporaryExtractionFailureMessage;
  }

  return noRecipeMessage;
}

export async function handleExtractRecipeRequest(request: Request, deps: HandlerDeps): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const userId = getUserIdFromAuthorizationHeader(request.headers.get('authorization'));
  if (!userId) {
    return jsonResponse({ error: 'missing_or_invalid_authorization' }, 401);
  }

  let payload: ExtractRequest;
  try {
    payload = (await request.json()) as ExtractRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (typeof payload.url !== 'string' || payload.url.length === 0) {
    return jsonResponse({ error: 'missing_url' }, 400);
  }

  if (!isHttpUrl(payload.url)) {
    return jsonResponse(
      { error: 'unsupported_recipe_url', message: unsupportedUrlMessage },
      422,
    );
  }

  const openAiKey = deps.env.get('OPENAI_API_KEY');
  if (!deps.extractRecipe && !openAiKey) {
    return jsonResponse(mockRecipeResponse(payload.url));
  }

  try {
    const extractor = deps.extractRecipe ?? extractRecipeWithOpenAI;
    const result = await extractor(payload.url, openAiKey ?? '');

    if (result.status === 'unsupported') {
      return jsonResponse(
        { error: 'unsupported_recipe_url', message: unsupportedUrlMessage },
        422,
      );
    }

    if (result.status === 'no_recipe') {
      return jsonResponse(
        { error: 'extraction_failed', message: noRecipeMessage },
        502,
      );
    }

    const body = recipeResponse(result.recipe, payload.url);
    if (!body) {
      return jsonResponse({ error: 'extraction_failed', message: noRecipeMessage }, 502);
    }

    return jsonResponse(body);
  } catch (error) {
    return jsonResponse(
      {
        error: 'extraction_failed',
        message: extractionFailureMessage(error),
      },
      502,
    );
  }
}
