import { AI_FETCH_TIMEOUT_MS, fetchWithTimeoutAndRetry } from '../_shared/resilientFetch.ts';
import { mealAnalysisJsonSchema } from './mealSchema.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
}

function extractGeminiText(data: GeminiResponse): string {
  for (const candidate of data.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (typeof part.text === 'string' && part.text.trim()) {
        return part.text;
      }
    }
  }

  throw new Error('gemini_missing_output_text');
}

async function imageInlineData(imageUrl: string) {
  const response = await fetchWithTimeoutAndRetry(imageUrl, {}, { timeoutMs: AI_FETCH_TIMEOUT_MS });
  if (!response.ok) {
    throw new Error(`gemini_image_fetch_failed_${response.status}`);
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const bytes = new Uint8Array(await response.arrayBuffer());

  return {
    mime_type: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
    data: bytesToBase64(bytes),
  };
}

export async function analyzeMealWithGemini(imageUrl: string, geminiKey: string): Promise<RawMealAnalysis> {
  const inlineData = await imageInlineData(imageUrl);
  const response = await fetchWithTimeoutAndRetry('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'x-goog-api-key': geminiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: inlineData },
            {
              text:
                'Analyze this meal photo for MacroLens. Return only JSON matching the provided schema. Preserve uncertainty as p10/p50/p90 ranges, include per-item hidden calorie risks, use exactly one short followUpQuestion only when it reduces the largest nutrition uncertainty, and never claim photo-only calories are exact.',
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseFormat: {
          text: {
            mimeType: 'application/json',
            schema: mealAnalysisJsonSchema,
          },
        },
      },
    }),
  }, { timeoutMs: AI_FETCH_TIMEOUT_MS });

  if (!response.ok) {
    throw new Error(`gemini_request_failed_${response.status}`);
  }

  return JSON.parse(extractGeminiText((await response.json()) as GeminiResponse)) as RawMealAnalysis;
}
