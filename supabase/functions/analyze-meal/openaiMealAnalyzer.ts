import { mealAnalysisJsonSchema } from './mealSchema.ts';

export type RawMealAnalysis = {
  mealName: string;
  confidence: 'high' | 'medium' | 'low';
  uncertaintyReasons: string[];
  items: Array<{
    name: string;
    canonicalFoodName: string;
    estimatedQuantity: number;
    unit: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
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

export async function analyzeMealWithOpenAI(imageUrl: string, openAiKey: string): Promise<RawMealAnalysis> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openAiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Analyze this food photo for a consumer macro tracker. Estimate visible foods, portions, calories, protein, carbs, fat, fiber, confidence, and uncertainty reasons. Be honest about hidden oil, sauces, and portion ambiguity.',
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
          name: 'macrolens_meal_analysis',
          schema: mealAnalysisJsonSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_request_failed_${response.status}`);
  }

  return JSON.parse(extractOutputText(await response.json())) as RawMealAnalysis;
}
