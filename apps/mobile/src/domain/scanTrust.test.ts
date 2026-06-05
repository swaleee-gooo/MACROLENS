import { describe, expect, it } from 'vitest';
import { buildScanTrustViewModel } from './scanTrust';

describe('buildScanTrustViewModel', () => {
  it('downgrades high confidence presentation when hidden calories make the scan ambiguous', () => {
    const viewModel = buildScanTrustViewModel({
      caloriesEstimate: 640,
      caloriesLow: 520,
      caloriesHigh: 820,
      proteinG: 32,
      confidence: 'high',
      uncertaintyReasons: ['salad_with_hidden_oil_cheese_or_sauce'],
      correctionSuggestions: [],
    });

    expect(viewModel.confidenceTier).toBe('medium');
    expect(viewModel.confidenceLabel).toBe('Needs review');
    expect(viewModel.prompts).toEqual(['Sauce, oil, or cheese added?']);
  });

  it('asks for barcode or label when a packaged product was analyzed as a meal photo', () => {
    const viewModel = buildScanTrustViewModel({
      caloriesEstimate: 230,
      caloriesLow: 170,
      caloriesHigh: 310,
      proteinG: 18,
      confidence: 'high',
      uncertaintyReasons: ['packaged_food_barcode_or_label_preferred'],
      correctionSuggestions: [],
    });

    expect(viewModel.confidenceTier).toBe('medium');
    expect(viewModel.prompts).toEqual(['Scan barcode or label instead?']);
  });

  it('shows wider calorie range and correction prompts for low confidence meals', () => {
    const viewModel = buildScanTrustViewModel({
      caloriesEstimate: 800,
      caloriesLow: 650,
      caloriesHigh: 980,
      proteinG: 40,
      confidence: 'low',
      uncertaintyReasons: ['poke_bowl_hidden_rice_or_sauce'],
      correctionSuggestions: [],
    });

    expect(viewModel.confidenceLabel).toBe('Conservative estimate');
    expect(viewModel.calorieRangeLabel).toBe('650-980 kcal');
    expect(viewModel.prompts).toEqual(['Sauce, oil, or cheese added?']);
  });
});
