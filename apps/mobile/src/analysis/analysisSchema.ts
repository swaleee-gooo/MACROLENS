import { z } from 'zod';

export const confidenceTierSchema = z.enum(['high', 'medium', 'low']);
export const nutritionSourceSchema = z.enum(['open_food_facts', 'nutrition_label_ocr', 'usda', 'estimated', 'mock']);

export const foodItemSchema = z.object({
  id: z.string().min(1),
  mealId: z.string().min(1),
  name: z.string().min(1),
  canonicalFoodName: z.string().min(1),
  estimatedQuantity: z.number().positive(),
  unit: z.string().min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  confidence: confidenceTierSchema,
  dataSource: nutritionSourceSchema,
  sourceFoodId: z.string().nullable(),
});

export const mealSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  imageUri: z.string().min(1),
  capturedAt: z.string().datetime(),
  mealName: z.string().min(1),
  caloriesEstimate: z.number().nonnegative(),
  caloriesLow: z.number().nonnegative(),
  caloriesHigh: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  confidence: confidenceTierSchema,
  notes: z.string(),
  source: nutritionSourceSchema,
  items: z.array(foodItemSchema).min(1),
});

export const analysisResultSchema = z.object({
  meal: mealSchema,
  uncertaintyReasons: z.array(z.string()).default([]),
  correctionSuggestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      correctionType: z.enum(['portion_up', 'portion_down', 'add_oil', 'add_sauce', 'remove_item']),
      targetItemId: z.string().nullable(),
    }),
  ),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export type AnalyzeMealInput = {
  imageUri: string;
  userId: string;
};

export type AnalysisService = {
  analyzeMealPhoto(input: AnalyzeMealInput): Promise<AnalysisResult>;
};
