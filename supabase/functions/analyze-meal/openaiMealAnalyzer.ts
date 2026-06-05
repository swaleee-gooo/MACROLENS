import { mealAnalysisJsonSchema } from './mealSchema.ts';

export type ConfidenceTier = 'high' | 'medium' | 'low';
export type ScanRoute = 'meal' | 'barcode' | 'nutrition_label' | 'packaged' | 'non_food' | 'unclear';
export type VisualQuality = 'good' | 'usable' | 'poor';
export type AmbiguityTier = 'low' | 'medium' | 'high';
export type MealItemRole = 'protein' | 'starch' | 'vegetable' | 'fat' | 'sauce' | 'dairy' | 'fruit' | 'drink' | 'dessert' | 'unknown';

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
  scanRoute?: ScanRoute;
  visualQuality?: VisualQuality;
  mealName: string;
  mealCategory: MealCategory;
  portionSize: PortionSize;
  portionAmbiguity?: AmbiguityTier;
  confidence: ConfidenceTier;
  needsUserQuestion?: boolean;
  followUpQuestion?: string;
  candidateMeals?: Array<{
    name: string;
    reason: string;
    confidence: ConfidenceTier;
  }>;
  uncertaintyReasons: string[];
  hiddenCalorieRisks: string[];
  items: Array<{
    name: string;
    canonicalFoodName: string;
    estimatedQuantity: number;
    quantityLow?: number;
    quantityHigh?: number;
    quantityP10?: number;
    quantityP50?: number;
    quantityP90?: number;
    unit: string;
    calories: number;
    calorieP10?: number;
    calorieP50?: number;
    calorieP90?: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    confidence: ConfidenceTier;
    portionConfidence?: ConfidenceTier;
    role?: MealItemRole;
    visualEvidence?: string[];
    hiddenCalorieRisks?: Array<{
      type: string;
      description: string;
      kcalImpactP10?: number;
      kcalImpactP50?: number;
      kcalImpactP90?: number;
      evidence?: string[];
      answerableQuestion?: string;
    }>;
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
      temperature: 0,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Analyze this image for MacroLens, a consumer macro tracker. For repeat scans of the exact same image, prefer the same scanRoute, visualQuality, meal category, portion size, ingredient names, and gram estimates unless the image clearly shows otherwise. First run scan preflight: classify scanRoute as meal, barcode, nutrition_label, packaged, non_food, or unclear; rate visualQuality as good, usable, or poor; and rate portionAmbiguity as low, medium, or high. If no food is visible, return isFoodPhoto=false, scanRoute="non_food", a short nonFoodReason, empty items, mealCategory="unknown", portionSize="unknown", visualQuality based on the image, confidence="low", and uncertaintyReasons explaining that no food is visible. If the main subject is a barcode, packaged front, or nutrition label, set scanRoute accordingly, mealCategory="packaged", confidence="low", needsUserQuestion=true, and include uncertaintyReasons item "packaged_food_barcode_or_label_preferred" because barcode or label scanning is preferred. If the photo is blurry, dark, cropped, too close, at an extreme angle, or shows multiple plates, keep isFoodPhoto=true only when food is visible, set visualQuality="poor" or "usable", confidence="low", portionAmbiguity="high", and ask exactly one short followUpQuestion that would reduce the largest nutrition uncertainty. For each item, return visualEvidence as concrete visible clues, role, portionConfidence, estimatedQuantity, quantityLow, quantityHigh, quantityP10, quantityP50, quantityP90, calorieP10, calorieP50, calorieP90, and hiddenCalorieRisks. Treat p50 as the best estimate, p10 as plausible low, and p90 as plausible high. Each item hiddenCalorieRisks entry must include type, description, kcalImpactP10, kcalImpactP50, kcalImpactP90, evidence, and answerableQuestion. Use candidateMeals for plausible alternatives; leave it empty when there are no meaningful alternatives. Do not let uncertainty text invent ingredients. Do not try to sound exact. Be conservative about restaurant bowls, pasta, salads, burgers, sauces, oil, avocado, cheese, fries, nuts, and rice hidden under toppings. For poke bowls, explicitly consider hidden rice base, sauce, avocado, edamame, toppings, and bowl depth. The calories and macros you return are fallback estimates only; backend calibration will recompute final totals.',
            },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'high',
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
