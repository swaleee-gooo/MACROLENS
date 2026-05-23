import { getUserIdFromAuthorizationHeader } from './auth.ts';
import { isNonFoodAnalysis } from './nutritionCalibration.ts';
import { toMacroLensResponse } from './nutritionEstimator.ts';
import { analyzeMealWithOpenAI, type RawMealAnalysis } from './openaiMealAnalyzer.ts';

type AnalyzeRequest = {
  imageUrl?: unknown;
};

type HandlerDeps = {
  env: {
    get(name: string): string | undefined;
  };
  analyzeMeal?: (imageUrl: string, openAiKey: string) => Promise<RawMealAnalysis>;
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
  });
}

function mockMealResponse(imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();

  return {
    meal: {
      id: mealId,
      userId,
      imageUri: imageUrl,
      capturedAt: new Date().toISOString(),
      mealName: 'Poulet, riz et legumes',
      caloriesEstimate: 506,
      caloriesLow: 430,
      caloriesHigh: 582,
      proteinG: 51,
      carbsG: 57.3,
      fatG: 6.1,
      fiberG: 4.6,
      confidence: 'medium',
      notes: 'Mock server response because OPENAI_API_KEY is not configured.',
      source: 'mock',
      items: [
        {
          id: `${mealId}-chicken`,
          mealId,
          name: 'Poulet grille',
          canonicalFoodName: 'chicken breast cooked',
          estimatedQuantity: 140,
          unit: 'g',
          calories: 231,
          proteinG: 43.4,
          carbsG: 0,
          fatG: 5,
          fiberG: 0,
          confidence: 'medium',
          dataSource: 'mock',
          sourceFoodId: null,
        },
      ],
    },
    uncertaintyReasons: ['portion_size_estimated_from_photo', 'hidden_oil_or_sauce_possible'],
    correctionSuggestions: [
      { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: null },
      { id: 'add-oil', label: 'Huile ajoutee', correctionType: 'add_oil', targetItemId: null },
    ],
  };
}

export async function handleAnalyzeMealRequest(request: Request, deps: HandlerDeps): Promise<Response> {
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

  let payload: AnalyzeRequest;
  try {
    payload = (await request.json()) as AnalyzeRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (typeof payload.imageUrl !== 'string' || payload.imageUrl.length === 0) {
    return jsonResponse({ error: 'missing_image_url' }, 400);
  }

  const openAiKey = deps.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    return jsonResponse(mockMealResponse(payload.imageUrl, userId));
  }

  try {
    const analyzeMeal = deps.analyzeMeal ?? analyzeMealWithOpenAI;
    const rawAnalysis = await analyzeMeal(payload.imageUrl, openAiKey);

    if (isNonFoodAnalysis(rawAnalysis)) {
      return jsonResponse(
        {
          error: 'non_food_photo',
          message: 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.',
        },
        422,
      );
    }

    return jsonResponse(toMacroLensResponse(rawAnalysis, payload.imageUrl, userId));
  } catch (error) {
    return jsonResponse(
      {
        error: 'analysis_failed',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      502,
    );
  }
}
