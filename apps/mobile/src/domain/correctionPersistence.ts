import type { CorrectionRepository } from '../metaboproof/correctionLoop';
import { applyMealCorrection, getMealCorrectionType, type MealCorrection } from './corrections';
import type { Meal } from './types';

function correctionField(correction: MealCorrection): 'label' | 'grams' | 'source' | 'portion' {
  if (correction.type === 'remove_item') {
    return 'label';
  }

  return 'portion';
}

export async function applyMealCorrectionWithLedger({
  meal,
  correction,
  repository,
  modelId = meal.scene?.modelId ?? meal.proof?.engine ?? 'app-correction',
  id = `${meal.id}-${correction.type}-${Date.now()}`,
  createdAt = new Date().toISOString(),
}: {
  meal: Meal;
  correction: MealCorrection;
  repository: CorrectionRepository;
  modelId?: string;
  id?: string;
  createdAt?: string;
}): Promise<Meal> {
  const correctedMeal = applyMealCorrection(meal, correction);
  const targetItem = correction.targetItemId ? meal.items.find((item) => item.id === correction.targetItemId) : null;

  await repository.saveCorrection({
    id,
    userId: meal.userId,
    mealId: meal.id,
    itemId: correction.targetItemId ?? 'meal',
    foodLabel: targetItem?.name ?? meal.mealName,
    modelId,
    field: correctionField(correction),
    previousValue: meal.caloriesEstimate,
    nextValue: correctedMeal.caloriesEstimate,
    correctionType: getMealCorrectionType(correction),
    createdAt,
  });

  return correctedMeal;
}
