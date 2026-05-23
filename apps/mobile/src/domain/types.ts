export type ConfidenceTier = 'high' | 'medium' | 'low';

export type NutritionSource = 'open_food_facts' | 'usda' | 'estimated' | 'mock';

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
};

export type UserGoal = 'lose_fat' | 'build_muscle' | 'maintain' | 'understand_eating';

export type UserProfile = {
  id: string;
  goal: UserGoal;
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  sex: 'female' | 'male' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  activityLevel: 'low' | 'moderate' | 'high';
  targetWeightKg: number | null;
  proteinTargetG: number;
  calorieTarget: number;
};
