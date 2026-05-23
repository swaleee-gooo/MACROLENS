import type { AnalysisService } from './analysisSchema';
import { analysisResultSchema } from './analysisSchema';
import { recalculateMeal } from '../domain/nutrition';
import type { FoodItem, Meal } from '../domain/types';

function createItem(overrides: Omit<FoodItem, 'mealId'>, mealId: string): FoodItem {
  return {
    ...overrides,
    mealId,
  };
}

export function createMockAnalysisService(): AnalysisService {
  return {
    async analyzeMealPhoto({ imageUri, userId }) {
      const mealId = `meal-${Date.now()}`;
      const capturedAt = new Date().toISOString();

      const items: FoodItem[] = [
        createItem(
          {
            id: `${mealId}-chicken`,
            name: 'Poulet grille',
            canonicalFoodName: 'chicken breast cooked',
            estimatedQuantity: 140,
            unit: 'g',
            calories: 231,
            proteinG: 43.4,
            carbsG: 0,
            fatG: 5,
            fiberG: 0,
            confidence: 'medium',
            dataSource: 'mock',
            sourceFoodId: null,
          },
          mealId,
        ),
        createItem(
          {
            id: `${mealId}-rice`,
            name: 'Riz blanc',
            canonicalFoodName: 'white rice cooked',
            estimatedQuantity: 170,
            unit: 'g',
            calories: 221,
            proteinG: 4.6,
            carbsG: 48.3,
            fatG: 0.5,
            fiberG: 0.6,
            confidence: 'medium',
            dataSource: 'mock',
            sourceFoodId: null,
          },
          mealId,
        ),
        createItem(
          {
            id: `${mealId}-vegetables`,
            name: 'Legumes verts',
            canonicalFoodName: 'mixed green vegetables cooked',
            estimatedQuantity: 120,
            unit: 'g',
            calories: 54,
            proteinG: 3,
            carbsG: 9,
            fatG: 0.6,
            fiberG: 4,
            confidence: 'high',
            dataSource: 'mock',
            sourceFoodId: null,
          },
          mealId,
        ),
      ];

      const meal: Meal = recalculateMeal({
        id: mealId,
        userId,
        imageUri,
        capturedAt,
        mealName: 'Poulet, riz et legumes',
        caloriesEstimate: 0,
        caloriesLow: 0,
        caloriesHigh: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        confidence: 'medium',
        notes: 'Estimation basee sur une portion visuelle standard.',
        source: 'mock',
        items,
      });

      return analysisResultSchema.parse({
        meal,
        uncertaintyReasons: ['portion_size_estimated_from_photo', 'hidden_oil_or_sauce_possible'],
        correctionSuggestions: [
          {
            id: 'portion-up',
            label: 'Portion +15%',
            correctionType: 'portion_up',
            targetItemId: null,
          },
          {
            id: 'portion-down',
            label: 'Portion -15%',
            correctionType: 'portion_down',
            targetItemId: null,
          },
          {
            id: 'add-oil',
            label: 'Huile ajoutee',
            correctionType: 'add_oil',
            targetItemId: null,
          },
        ],
      });
    },
  };
}
