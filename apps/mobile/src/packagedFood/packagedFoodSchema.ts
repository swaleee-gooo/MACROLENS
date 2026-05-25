import { z } from 'zod';

export const packagedFoodItemSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1),
  caloriesPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative(),
  carbsPer100g: z.number().nonnegative(),
  fatPer100g: z.number().nonnegative(),
  fiberPer100g: z.number().nonnegative(),
  source: z.enum(['open_food_facts', 'nutrition_label_ocr']),
});

export type PackagedFoodItem = {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  source: 'open_food_facts' | 'nutrition_label_ocr';
};
