export type EvidenceLevel =
  | 'VERIFIED_BARCODE_WEIGHT'
  | 'VERIFIED_RECIPE_WEIGHT'
  | 'VERIFIED_PLATE_WEIGHT'
  | 'CALIBRATED_TOTAL_WEIGHT'
  | 'ESTIMATED_VISUAL_ONLY'
  | 'RESEARCH_PREDICTED_MASS';

export type ProofStatus = 'verified' | 'calibrated' | 'research' | 'estimated';

export type NutritionSourceProvider = 'USDA_FDC' | 'OPEN_FOOD_FACTS' | 'USER_CUSTOM';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type AppNutritionSource = 'open_food_facts' | 'nutrition_label_ocr' | 'usda' | 'estimated' | 'mock';

export type FoodSceneItemRole = 'protein' | 'starch' | 'vegetable' | 'fat' | 'sauce' | 'dairy' | 'fruit' | 'drink' | 'dessert' | 'unknown';

export type QuantileEstimateMethod = 'model_range' | 'risk_model' | 'calibrated_user' | 'verified_quantity' | 'fallback_margin';

export type QuantileEstimate = {
  p10: number;
  p50: number;
  p90: number;
  unit: string;
  method: QuantileEstimateMethod | string;
};

export type HiddenCalorieRisk = {
  type: string;
  targetItemId: string | null;
  description: string;
  kcalImpact: QuantileEstimate;
  evidence: string[];
  answerableQuestion: string;
};

export type FoodSceneItem = {
  id: string;
  label: string;
  canonicalFoodName: string;
  role: FoodSceneItemRole;
  visualEvidence: string[];
  grams: QuantileEstimate;
  kcal: QuantileEstimate;
  confidence: ConfidenceTier;
  dataSource: AppNutritionSource;
  sourceFoodId: string | null;
  hiddenCalorieRisks: HiddenCalorieRisk[];
};

export type FoodSceneAnalysis = {
  id: string;
  parserVersion: string;
  modelId: string;
  imageInputs: Array<{
    uri: string;
    role: string;
  }>;
  visualQuality: 'good' | 'usable' | 'poor';
  portionAmbiguity: 'low' | 'medium' | 'high';
  evidenceLevel: EvidenceLevel;
  items: FoodSceneItem[];
  hiddenCalorieRisks: HiddenCalorieRisk[];
  uncertaintyDrivers: string[];
  candidateMeals: Array<{
    name: string;
    reason: string;
    confidence: ConfidenceTier;
  }>;
};

export type NutritionSource = {
  provider: NutritionSourceProvider;
  externalId: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type MealItem = {
  id: string;
  label: string;
  grams?: number;
  estimatedGrams?: number;
  confidence: number;
  source: NutritionSource;
  evidenceLevel: EvidenceLevel;
};

export type KcalRange = {
  min: number;
  max: number;
};

export type MealAnalysis = {
  id: string;
  items: MealItem[];
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  evidenceLevel: EvidenceLevel;
  kcalRange?: KcalRange;
  warnings: string[];
  explanation: string[];
};
