import { mealAnalysisJsonSchema } from './mealSchema.ts';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type MealCategory =
  | 'poke_bowl'
  | 'pasta'
  | 'burger_fries'
  | 'salad'
  | 'sandwich'
  | 'mixed_plate'
  | 'dessert'
  | 'drink'
  | 'packaged'
  | 'unknown';

export type PortionSize = 'small' | 'standard' | 'large' | 'unknown';

export type RawMealAnalysis = {
  isFoodPhoto: boolean;
  nonFoodReason: string;
  mealName: string;
  mealCategory: MealCategory;
  portionSize: PortionSize;
  confidence: ConfidenceTier;
  uncertaintyReasons: string[];
  hiddenCalorieRisks: string[];
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
    confidence: ConfidenceTier;
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
      temperature: 0.1,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Analyze this image for MacroLens, a consumer macro tracker. First decide if the image contains a real edible meal, snack, packaged food, or drink. If no food is visible, return isFoodPhoto=false, a short nonFoodReason, empty items, mealCategory="unknown", portionSize="unknown", confidence="low", and uncertaintyReasons explaining that no food is visible. If food is visible, return isFoodPhoto=true and identify the meal category, portion size, visible ingredients, estimated grams, and hidden calorie risks. Do not try to sound exact. Be conservative about restaurant bowls, pasta, salads, burgers, sauces, oil, avocado, cheese, fries, nuts, and rice hidden under toppings. For poke bowls, explicitly consider hidden rice base, sauce, avocado, edamame, toppings, and bowl depth. The calories and macros you return are fallback estimates only; backend calibration will recompute final totals.',
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
