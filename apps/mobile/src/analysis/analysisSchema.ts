import { z } from 'zod';

export const confidenceTierSchema = z.enum(['high', 'medium', 'low']);
export const nutritionSourceSchema = z.enum(['open_food_facts', 'nutrition_label_ocr', 'usda', 'estimated', 'mock']);
export const scanRouteSchema = z.enum(['meal', 'barcode', 'nutrition_label', 'packaged', 'non_food', 'unclear']);
export const visualQualitySchema = z.enum(['good', 'usable', 'poor']);
export const portionAmbiguitySchema = z.enum(['low', 'medium', 'high']);
export const evidenceLevelSchema = z.enum([
  'VERIFIED_BARCODE_WEIGHT',
  'VERIFIED_RECIPE_WEIGHT',
  'VERIFIED_PLATE_WEIGHT',
  'CALIBRATED_TOTAL_WEIGHT',
  'ESTIMATED_VISUAL_ONLY',
  'RESEARCH_PREDICTED_MASS',
]);
export const proofStatusSchema = z.enum(['verified', 'calibrated', 'research', 'estimated']);
export const nutritionSourceProviderSchema = z.enum(['USDA_FDC', 'OPEN_FOOD_FACTS', 'USER_CUSTOM']);

export const scanReviewSchema = z.object({
  scanRoute: scanRouteSchema,
  visualQuality: visualQualitySchema,
  portionAmbiguity: portionAmbiguitySchema,
  needsUserQuestion: z.boolean(),
  followUpQuestion: z.string(),
  candidateMeals: z.array(
    z.object({
      name: z.string().min(1),
      reason: z.string(),
      confidence: confidenceTierSchema,
    }),
  ),
});

export const quantileTripletSchema = z.object({
  p10: z.number().nonnegative(),
  p50: z.number().nonnegative(),
  p90: z.number().nonnegative(),
});

export const quantileEstimateSchema = quantileTripletSchema.extend({
  unit: z.string().min(1),
  method: z.string().min(1),
});

export const hiddenCalorieRiskSchema = z.object({
  type: z.string().min(1),
  targetItemId: z.string().nullable(),
  description: z.string(),
  kcalImpact: quantileEstimateSchema,
  evidence: z.array(z.string()),
  answerableQuestion: z.string(),
});

export const foodSceneItemRoleSchema = z.enum(['protein', 'starch', 'vegetable', 'fat', 'sauce', 'dairy', 'fruit', 'drink', 'dessert', 'unknown']);

export const foodSceneItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  canonicalFoodName: z.string().min(1),
  role: foodSceneItemRoleSchema,
  visualEvidence: z.array(z.string()),
  grams: quantileEstimateSchema,
  kcal: quantileEstimateSchema,
  confidence: confidenceTierSchema,
  dataSource: nutritionSourceSchema,
  sourceFoodId: z.string().nullable(),
  hiddenCalorieRisks: z.array(hiddenCalorieRiskSchema),
});

export const foodSceneAnalysisSchema = z.object({
  id: z.string().min(1),
  parserVersion: z.string().min(1),
  modelId: z.string().min(1),
  imageInputs: z.array(
    z.object({
      uri: z.string().min(1),
      role: z.string().min(1),
    }),
  ),
  visualQuality: visualQualitySchema,
  portionAmbiguity: portionAmbiguitySchema,
  evidenceLevel: evidenceLevelSchema,
  items: z.array(foodSceneItemSchema),
  hiddenCalorieRisks: z.array(hiddenCalorieRiskSchema),
  uncertaintyDrivers: z.array(z.string()),
  candidateMeals: z.array(
    z.object({
      name: z.string().min(1),
      reason: z.string(),
      confidence: confidenceTierSchema,
    }),
  ),
});

export const foodItemSchema = z.object({
  id: z.string().min(1),
  mealId: z.string().min(1),
  name: z.string().min(1),
  canonicalFoodName: z.string().min(1),
  estimatedQuantity: z.number().positive(),
  quantityGrams: quantileTripletSchema.optional(),
  calorieQuantiles: quantileTripletSchema.optional(),
  unit: z.string().min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  confidence: confidenceTierSchema,
  dataSource: nutritionSourceSchema,
  sourceFoodId: z.string().nullable(),
  hiddenCalorieRisks: z.array(hiddenCalorieRiskSchema).optional(),
});

export const mealProofMetadataSchema = z.object({
  engine: z.literal('MetaboProof'),
  evidenceLevel: evidenceLevelSchema,
  status: proofStatusSchema,
  kcalRange: z.object({ min: z.number().nonnegative(), max: z.number().nonnegative() }).optional(),
  warnings: z.array(z.string()),
  explanation: z.array(z.string()),
  sources: z.array(
    z.object({
      provider: nutritionSourceProviderSchema,
      externalId: z.string(),
      name: z.string(),
    }),
  ),
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
  proof: mealProofMetadataSchema.optional(),
  scene: foodSceneAnalysisSchema.optional(),
});

export const analysisResultSchema = z.object({
  meal: mealSchema,
  uncertaintyReasons: z.array(z.string()).default([]),
  scanReview: scanReviewSchema.optional(),
  correctionSuggestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      correctionType: z.enum(['portion_up', 'portion_down', 'portion_half', 'add_oil', 'add_sauce', 'add_cheese', 'remove_item']),
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
