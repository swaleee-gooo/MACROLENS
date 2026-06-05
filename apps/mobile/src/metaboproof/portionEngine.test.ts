import { describe, expect, it } from 'vitest';
import { buildPersonalFoodGraph } from './personalFoodGraph';
import { createExpoPortionCapabilities, estimatePortion } from './portionEngine';

describe('estimatePortion', () => {
  it('narrows grams p10/p90 when top and side photos are both present', () => {
    const single = estimatePortion({
      baseGramsP50: 240,
      evidence: [{ type: 'single_photo', imageUris: ['file://top.jpg'] }],
    });
    const multi = estimatePortion({
      baseGramsP50: 240,
      evidence: [{ type: 'multi_photo_top_side', imageUris: ['file://top.jpg', 'file://side.jpg'] }],
    });

    expect(multi.grams.p90 - multi.grams.p10).toBeLessThan(single.grams.p90 - single.grams.p10);
    expect(multi.evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
  });

  it('uses known container evidence only after enough confirmed samples', () => {
    const graph = buildPersonalFoodGraph({
      userId: 'user-1',
      meals: [],
      corrections: [],
      calibrations: [
        { id: 'c1', userId: 'user-1', foodLabel: 'Rice', containerKey: 'blue-bowl', estimatedGrams: 200, verifiedGrams: 240, residualGrams: 40, source: 'manual_verified_weight', createdAt: '2026-06-01T10:00:00.000Z' },
        { id: 'c2', userId: 'user-1', foodLabel: 'Rice', containerKey: 'blue-bowl', estimatedGrams: 200, verifiedGrams: 250, residualGrams: 50, source: 'manual_verified_weight', createdAt: '2026-06-02T10:00:00.000Z' },
        { id: 'c3', userId: 'user-1', foodLabel: 'Rice', containerKey: 'blue-bowl', estimatedGrams: 200, verifiedGrams: 260, residualGrams: 60, source: 'manual_verified_weight', createdAt: '2026-06-03T10:00:00.000Z' },
      ],
    });

    const estimate = estimatePortion({
      baseGramsP50: 220,
      graph,
      evidence: [{ type: 'known_container', containerKey: 'blue-bowl' }],
    });

    expect(estimate.grams.p50).toBe(250);
    expect(estimate.grams.p90 - estimate.grams.p10).toBeLessThan(120);

    const weakGraph = buildPersonalFoodGraph({
      userId: 'user-1',
      meals: [],
      corrections: [],
      calibrations: [
        { id: 'c1', userId: 'user-1', foodLabel: 'Rice', containerKey: 'blue-bowl', estimatedGrams: 200, verifiedGrams: 240, residualGrams: 40, source: 'manual_verified_weight', createdAt: '2026-06-01T10:00:00.000Z' },
        { id: 'c2', userId: 'user-1', foodLabel: 'Rice', containerKey: 'blue-bowl', estimatedGrams: 200, verifiedGrams: 260, residualGrams: 60, source: 'manual_verified_weight', createdAt: '2026-06-02T10:00:00.000Z' },
      ],
    });
    const weakEstimate = estimatePortion({
      baseGramsP50: 220,
      graph: weakGraph,
      evidence: [{ type: 'known_container', containerKey: 'blue-bowl' }],
    });

    expect(weakEstimate.grams.p50).toBe(220);
    expect(weakEstimate.ignoredEvidence).toContain('known_container:blue-bowl');
  });

  it('ignores reference object evidence when the object is not detected or the user cancels', () => {
    const estimate = estimatePortion({
      baseGramsP50: 180,
      evidence: [
        { type: 'single_photo', imageUris: ['file://plate.jpg'] },
        { type: 'reference_object', referenceObjectKey: 'card', detected: false },
        { type: 'reference_object', referenceObjectKey: '330ml_can', cancelled: true },
      ],
    });

    expect(estimate.ignoredEvidence).toEqual(['reference_object:card', 'reference_object:330ml_can']);
    expect(estimate.grams).toEqual({ p10: 117, p50: 180, p90: 288, unit: 'g', method: 'model_range' });
  });

  it('keeps Expo-only builds from claiming AR or depth evidence', () => {
    const estimate = estimatePortion({
      baseGramsP50: 200,
      runtimeCapabilities: createExpoPortionCapabilities(),
      evidence: [
        { type: 'device_depth', depthAvailable: true },
        { type: 'ar_session', arSessionAvailable: true },
      ],
    });

    expect(estimate.depthAvailable).toBe(false);
    expect(estimate.arAvailable).toBe(false);
    expect(estimate.ignoredEvidence).toEqual(['device_depth', 'ar_session']);
    expect(estimate.evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
  });
});
