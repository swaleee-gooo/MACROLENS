import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { analyzeMealWithOpenAI } from './openaiMealAnalyzer.ts';
import { toMacroLensResponse } from './nutritionEstimator.ts';

type AnalyzeRequest = {
  imageUrl: string;
  userId: string;
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

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  let payload: AnalyzeRequest;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!payload.imageUrl || !payload.userId) {
    return jsonResponse({ error: 'missing_image_url_or_user_id' }, 400);
  }

  const mealId = crypto.randomUUID();
  const openAiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openAiKey) {
    return jsonResponse({
      meal: {
        id: mealId,
        userId: payload.userId,
        imageUri: payload.imageUrl,
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
    });
  }

  try {
    const rawAnalysis = await analyzeMealWithOpenAI(payload.imageUrl, openAiKey);
    return jsonResponse(toMacroLensResponse(rawAnalysis, payload.imageUrl, payload.userId));
  } catch (error) {
    return jsonResponse(
      {
        error: 'analysis_failed',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      502,
    );
  }
});
