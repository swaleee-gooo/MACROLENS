import { describe, expect, it } from 'vitest';
import { buildScanTrustViewModel } from './scanTrust';

describe('buildScanTrustViewModel', () => {
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

    expect(viewModel.confidenceLabel).toBe('Estimation prudente');
    expect(viewModel.calorieRangeLabel).toBe('650-980 kcal');
    expect(viewModel.prompts).toContain('Sauce ou huile visible ?');
    expect(viewModel.prompts).toContain('Portion plus grande que prevu ?');
  });
});
