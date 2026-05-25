import { nutritionLabelOcrJsonSchema } from './nutritionLabelSchema.ts';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type RawNutritionLabelOcr = {
  isNutritionLabel: boolean;
  productName: string;
  servingSizeText: string;
  servingGrams: number | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  confidence: ConfidenceTier;
  missingFields: string[];
};

type ResponseOutputContent = {
  type?: string;
  text?: string;
};

type ResponseOutputItem = {
  content?: ResponseOutputContent[];
};

function extractOutputText(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'output_text' in data && typeof data.output_text === 'string') {
    return data.output_text;
  }

  if (typeof data !== 'object' || data === null || !('output' in data) || !Array.isArray(data.output)) {
    throw new Error('openai_missing_output_text');
  }

  for (const item of data.output as ResponseOutputItem[]) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  throw new Error('openai_missing_output_text');
}

export async function scanNutritionLabelWithOpenAI(imageUrl: string, openAiKey: string): Promise<RawNutritionLabelOcr> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openAiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Read this packaged food nutrition label for MacroLens. Return values normalized per 100 g whenever visible. If only per serving is visible, derive per 100 g only when the serving weight in grams is readable. If the image is not a nutrition label, or the calories/protein/carbs/fat values are not readable, return isNutritionLabel=false, null numeric fields, confidence="low", and list missing fields. Prefer the product name visible on the label; otherwise use "Produit etiquete". Do not infer hidden nutrients from memory.',
            },
            {
              type: 'input_image',
              image_url: imageUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'macrolens_nutrition_label_ocr',
          schema: nutritionLabelOcrJsonSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_request_failed_${response.status}`);
  }

  return JSON.parse(extractOutputText(await response.json())) as RawNutritionLabelOcr;
}
