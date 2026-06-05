import type { EvidenceLevel, FoodSceneAnalysis, HiddenCalorieRisk, NutritionSourceProvider, ProofStatus } from '../metaboproof/types';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export type NutritionSource = 'open_food_facts' | 'nutrition_label_ocr' | 'usda' | 'estimated' | 'mock';

export type ScanRoute = 'meal' | 'barcode' | 'nutrition_label' | 'packaged' | 'non_food' | 'unclear';

export type VisualQuality = 'good' | 'usable' | 'poor';

export type PortionAmbiguity = 'low' | 'medium' | 'high';

export type ScanReview = {
  scanRoute: ScanRoute;
  visualQuality: VisualQuality;
  portionAmbiguity: PortionAmbiguity;
  needsUserQuestion: boolean;
  followUpQuestion: string;
  candidateMeals: Array<{
    name: string;
    reason: string;
    confidence: ConfidenceTier;
  }>;
};

export type CorrectionType = 'portion_up' | 'portion_down' | 'portion_half' | 'add_oil' | 'add_sauce' | 'add_cheese' | 'remove_item';

export type CorrectionSuggestion = {
  id: string;
  label: string;
  correctionType: CorrectionType;
  targetItemId: string | null;
};

export type NutritionTotals = {
  calories: number;
  caloriesLow: number;
  caloriesHigh: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FoodItem = {
  id: string;
  mealId: string;
  name: string;
  canonicalFoodName: string;
  estimatedQuantity: number;
  quantityGrams?: { p10: number; p50: number; p90: number };
  calorieQuantiles?: { p10: number; p50: number; p90: number };
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: ConfidenceTier;
  dataSource: NutritionSource;
  sourceFoodId: string | null;
  hiddenCalorieRisks?: HiddenCalorieRisk[];
};

export type MealProofMetadata = {
  engine: 'MetaboProof';
  evidenceLevel: EvidenceLevel;
  status: ProofStatus;
  kcalRange?: { min: number; max: number };
  warnings: string[];
  explanation: string[];
  sources: Array<{
    provider: NutritionSourceProvider;
    externalId: string;
    name: string;
  }>;
};

export type Meal = {
  id: string;
  userId: string;
  imageUri: string;
  capturedAt: string;
  mealName: string;
  caloriesEstimate: number;
  caloriesLow: number;
  caloriesHigh: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: ConfidenceTier;
  notes: string;
  source: NutritionSource;
  items: FoodItem[];
  uncertaintyReasons?: string[];
  correctionSuggestions?: CorrectionSuggestion[];
  scanReview?: ScanReview;
  proof?: MealProofMetadata;
  scene?: FoodSceneAnalysis;
};

export type UserGoal = 'lose_fat' | 'build_muscle' | 'maintain' | 'understand_eating';

export type MacroTargets = {
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  fiberTargetG: number;
  calorieOverride: number | null;
  proteinOverrideG: number | null;
};

export type UserProfile = {
  id: string;
  goal: UserGoal;
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  sex: 'female' | 'male' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  activityLevel: 'low' | 'moderate' | 'high';
  targetWeightKg: number | null;
  targets: MacroTargets;
  updatedAt: string;
};
