import { getUserIdFromAuthorizationHeader } from '../analyze-meal/auth.ts';
import { scanNutritionLabelWithOpenAI, type RawNutritionLabelOcr } from './openaiNutritionLabelOcr.ts';

type ScanNutritionLabelRequest = {
  imageUrl?: unknown;
};

type HandlerDeps = {
  env: {
    get(name: string): string | undefined;
  };
  scanLabel?: (imageUrl: string, openAiKey: string) => Promise<RawNutritionLabelOcr>;
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

function isUsableMacro(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function toLabelOcrResponse(raw: RawNutritionLabelOcr) {
  if (
    !raw.isNutritionLabel ||
    !isUsableMacro(raw.caloriesPer100g) ||
    !isUsableMacro(raw.proteinPer100g) ||
    !isUsableMacro(raw.carbsPer100g) ||
    !isUsableMacro(raw.fatPer100g)
  ) {
    return null;
  }

  const barcode = `label-${crypto.randomUUID()}`;
  const servingGrams = isUsableMacro(raw.servingGrams) && raw.servingGrams > 0 ? roundMacro(raw.servingGrams) : 100;

  return {
    item: {
      barcode,
      name: raw.productName.trim() || 'Produit etiquete',
      caloriesPer100g: Math.round(raw.caloriesPer100g),
      proteinPer100g: roundMacro(raw.proteinPer100g),
      carbsPer100g: roundMacro(raw.carbsPer100g),
      fatPer100g: roundMacro(raw.fatPer100g),
      fiberPer100g: isUsableMacro(raw.fiberPer100g) ? roundMacro(raw.fiberPer100g) : 0,
      source: 'nutrition_label_ocr',
    },
    servingGrams,
    confidence: raw.confidence,
    missingFields: raw.missingFields,
  };
}

export async function handleScanNutritionLabelRequest(request: Request, deps: HandlerDeps): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  if (!getUserIdFromAuthorizationHeader(request.headers.get('authorization'))) {
    return jsonResponse({ error: 'missing_or_invalid_authorization' }, 401);
  }

  let payload: ScanNutritionLabelRequest;
  try {
    payload = (await request.json()) as ScanNutritionLabelRequest;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (typeof payload.imageUrl !== 'string' || payload.imageUrl.length === 0) {
    return jsonResponse({ error: 'missing_image_url' }, 400);
  }

  const openAiKey = deps.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    return jsonResponse({ error: 'openai_not_configured' }, 503);
  }

  try {
    const scanLabel = deps.scanLabel ?? scanNutritionLabelWithOpenAI;
    const raw = await scanLabel(payload.imageUrl, openAiKey);
    const labelResponse = toLabelOcrResponse(raw);

    if (!labelResponse) {
      return jsonResponse(
        {
          error: 'nutrition_label_not_found',
          message: 'Je ne lis pas assez clairement le tableau nutritionnel. Reprends la photo de face avec les valeurs par 100 g visibles.',
        },
        422,
      );
    }

    return jsonResponse(labelResponse);
  } catch (error) {
    return jsonResponse(
      {
        error: 'label_ocr_failed',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      502,
    );
  }
}
