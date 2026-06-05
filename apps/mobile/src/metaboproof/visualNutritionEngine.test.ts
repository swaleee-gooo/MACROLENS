import { describe, expect, it } from 'vitest';
import { createVisionModelRouter, createVisualNutritionEngine } from './visualNutritionEngine';
import type { NutritionSource } from './types';

const banana: NutritionSource = {
  provider: 'USDA_FDC',
  externalId: '173944',
  name: 'Banana raw',
  kcalPer100g: 89,
  proteinPer100g: 1.1,
  carbsPer100g: 22.8,
  fatPer100g: 0.3,
};

describe('MetaboProof visual nutrition engine', () => {
  it('never promotes photo-only output to verified evidence', async () => {
    const router = createVisionModelRouter({
      defaultModel: {
        id: 'gemini-2.5-flash-lite',
        analyzeImage: async () => ({
          modelId: 'gemini-2.5-flash-lite',
          candidates: [{ label: 'banana', estimatedGrams: 118, confidence: 0.82 }],
          tokenUsage: { inputTokens: 900, outputTokens: 160 },
        }),
      },
    });
    const engine = createVisualNutritionEngine({
      router,
      resolver: { resolve: async () => banana },
    });

    const analysis = await engine.analyzeImage({ id: 'meal-1', imageUri: 'file://banana.jpg' });

    expect(analysis.evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
    expect(analysis.items[0].evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
    expect(analysis.warnings[0]).toContain('Photo-only');
  });

  it('escalates to the higher-cost model only when confidence is below the threshold', async () => {
    const calls: string[] = [];
    const router = createVisionModelRouter({
      escalationThreshold: 0.65,
      defaultModel: {
        id: 'cheap-model',
        analyzeImage: async () => {
          calls.push('cheap-model');
          return {
            modelId: 'cheap-model',
            candidates: [{ label: 'rice', estimatedGrams: 180, confidence: 0.52 }],
          };
        },
      },
      fallbackModel: {
        id: 'review-model',
        analyzeImage: async () => {
          calls.push('review-model');
          return {
            modelId: 'review-model',
            candidates: [{ label: 'rice', estimatedGrams: 190, confidence: 0.74 }],
          };
        },
      },
    });
    const engine = createVisualNutritionEngine({ router, resolver: { resolve: async () => banana } });

    await engine.analyzeImage({ id: 'meal-1', imageUri: 'file://rice.jpg' });

    expect(calls).toEqual(['cheap-model', 'review-model']);
  });
});
