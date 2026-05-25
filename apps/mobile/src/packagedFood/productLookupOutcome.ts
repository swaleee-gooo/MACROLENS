import type { PackagedFoodItem } from './packagedFoodSchema';

export type ProductLookupOutcome =
  | { status: 'found'; item: PackagedFoodItem; nextAction: 'confirm_serving' }
  | { status: 'needs_label'; item: PackagedFoodItem; nextAction: 'scan_label' }
  | { status: 'not_found'; barcode: string; nextAction: 'manual_or_label' };

type ResolvedProductLookupOutcome = Extract<ProductLookupOutcome, { status: 'found' | 'needs_label' }>;

function hasCompleteNutrition(item: PackagedFoodItem): boolean {
  return item.caloriesPer100g > 0 && (item.proteinPer100g > 0 || item.carbsPer100g > 0 || item.fatPer100g > 0);
}

export function normalizeProductLookupOutcome(item: PackagedFoodItem): ResolvedProductLookupOutcome {
  if (!hasCompleteNutrition(item)) {
    return { status: 'needs_label', item, nextAction: 'scan_label' };
  }

  return { status: 'found', item, nextAction: 'confirm_serving' };
}

export function notFoundProductLookupOutcome(barcode: string): ProductLookupOutcome {
  return { status: 'not_found', barcode, nextAction: 'manual_or_label' };
}
