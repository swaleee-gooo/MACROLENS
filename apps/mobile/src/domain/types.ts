export type ConfidenceTier = 'high' | 'medium' | 'low';

export type NutritionSource = 'open_food_facts' | 'nutrition_label_ocr' | 'usda' | 'estimated' | 'mock';

export type CorrectionType = 'portion_up' | 'portion_down' | 'add_oil' | 'add_sauce' | 'remove_item';

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
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: ConfidenceTier;
  dataSource: NutritionSource;
  sourceFoodId: string | null;
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
