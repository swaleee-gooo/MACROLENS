import { describe, expect, it } from 'vitest';
import { normalizeProductLookupOutcome, notFoundProductLookupOutcome } from './productLookupOutcome';

describe('normalizeProductLookupOutcome', () => {
  it('marks complete Open Food Facts products as found', () => {
    const outcome = normalizeProductLookupOutcome({
      barcode: '3017620422003',
      name: 'Nutella - Ferrero',
      caloriesPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });

    expect(outcome.status).toBe('found');
    expect(outcome.nextAction).toBe('confirm_serving');
  });

  it('marks products without enough nutrition as needs_label', () => {
    const outcome = normalizeProductLookupOutcome({
      barcode: 'missing-nutrition',
      name: 'Produit incomplet',
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });

    expect(outcome.status).toBe('needs_label');
    expect(outcome.nextAction).toBe('scan_label');
  });

  it('represents a missing barcode as manual or label recovery', () => {
    const outcome = notFoundProductLookupOutcome('0000000000000');

    expect(outcome).toEqual({
      status: 'not_found',
      barcode: '0000000000000',
      nextAction: 'manual_or_label',
    });
  });
});
