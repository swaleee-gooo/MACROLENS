import { describe, expect, it } from 'vitest';
import { createPackagedFoodMeal } from './packagedFoodMeal';

describe('createPackagedFoodMeal', () => {
  it('creates a meal from packaged food nutrition per 100g', () => {
    const meal = createPackagedFoodMeal({
      userId: 'local-user',
      servingGrams: 30,
      item: {
        barcode: '3017620422003',
        name: 'Nutella',
        caloriesPer100g: 539,
        proteinPer100g: 6.3,
        carbsPer100g: 57.5,
        fatPer100g: 30.9,
        fiberPer100g: 0,
        source: 'open_food_facts',
      },
      capturedAt: '2026-05-25T12:00:00.000Z',
    });

    expect(meal.mealName).toBe('Nutella');
    expect(meal.source).toBe('open_food_facts');
    expect(meal.caloriesEstimate).toBe(162);
    expect(meal.proteinG).toBe(1.9);
    expect(meal.items[0].estimatedQuantity).toBe(30);
  });

  it('keeps the label photo URI when a meal comes from nutrition label OCR', () => {
    const meal = createPackagedFoodMeal({
      userId: 'local-user',
      servingGrams: 125,
      imageUri: 'file://label.jpg',
      item: {
        barcode: 'label-123',
        name: 'Yaourt grec',
        caloriesPer100g: 92,
        proteinPer100g: 9.8,
        carbsPer100g: 3.5,
        fatPer100g: 4.1,
        fiberPer100g: 0,
        source: 'nutrition_label_ocr',
      },
      capturedAt: '2026-05-25T12:00:00.000Z',
    });

    expect(meal.imageUri).toBe('file://label.jpg');
    expect(meal.source).toBe('nutrition_label_ocr');
    expect(meal.proteinG).toBe(12.3);
  });
});
