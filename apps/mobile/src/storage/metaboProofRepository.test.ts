import { describe, expect, it } from 'vitest';
import { summarizeCorrectionRecords, type CorrectionRepository } from '../metaboproof/correctionLoop';
import { createMemoryStorageAdapter } from './mealRepository';
import { createMetaboProofRepository } from './metaboProofRepository';

describe('MetaboProof repository', () => {
  it('persists analysis events, corrections, calibrations, and personal graph stats across repository instances', async () => {
    const storage = createMemoryStorageAdapter();
    const repository = createMetaboProofRepository(storage);

    await repository.saveAnalysisEvent({
      id: 'event-1',
      userId: 'user-1',
      mealId: 'meal-1',
      modelId: 'gpt-4o',
      provider: 'openai',
      imageCount: 2,
      scenePayload: { parserVersion: 'food-scene-v1' },
      tokenUsage: { inputTokens: 1200, outputTokens: 300 },
      latencyMs: 1840,
      costEstimateUsd: 0.018,
      createdAt: '2026-06-04T10:00:00.000Z',
    });

    await repository.saveCorrection({
      id: 'correction-1',
      userId: 'user-1',
      mealId: 'meal-1',
      itemId: 'item-rice',
      foodLabel: 'Rice',
      modelId: 'gpt-4o',
      field: 'grams',
      previousValue: 180,
      nextValue: 240,
      correctionType: 'portion_up',
      createdAt: '2026-06-04T10:01:00.000Z',
    });

    await repository.saveCalibration({
      id: 'calibration-1',
      userId: 'user-1',
      foodLabel: 'Rice',
      containerKey: 'blue-bowl',
      estimatedGrams: 180,
      verifiedGrams: 240,
      residualGrams: 60,
      source: 'manual_verified_weight',
      createdAt: '2026-06-04T10:02:00.000Z',
    });

    await repository.upsertPersonalGraphStat({
      userId: 'user-1',
      graphKey: 'food:rice',
      graphType: 'food',
      statsPayload: { medianGrams: 240, count: 3 },
      updatedAt: '2026-06-04T10:03:00.000Z',
    });

    const restarted = createMetaboProofRepository(storage);

    await expect(restarted.listAnalysisEvents('user-1')).resolves.toHaveLength(1);
    await expect(restarted.listCorrections('user-1')).resolves.toHaveLength(1);
    await expect(restarted.listCalibrations('user-1')).resolves.toHaveLength(1);
    await expect(restarted.listPersonalGraphStats('user-1')).resolves.toEqual([
      expect.objectContaining({ graphKey: 'food:rice', statsPayload: { medianGrams: 240, count: 3 } }),
    ]);
  });

  it('keeps correction summaries usable after app restart', async () => {
    const storage = createMemoryStorageAdapter();
    const repository: CorrectionRepository = createMetaboProofRepository(storage);

    await repository.saveCorrection({
      id: 'correction-1',
      userId: 'user-1',
      mealId: 'meal-1',
      itemId: 'item-rice',
      foodLabel: 'Rice',
      modelId: 'gpt-4o',
      field: 'grams',
      previousValue: 180,
      nextValue: 240,
      correctionType: 'portion_up',
      createdAt: '2026-06-04T10:01:00.000Z',
    });

    const restarted: CorrectionRepository = createMetaboProofRepository(storage);
    const summary = summarizeCorrectionRecords(await restarted.listCorrections('user-1'), {
      totalMealsByFood: { Rice: 4 },
      totalScansByModel: { 'gpt-4o': 10 },
    });

    expect(summary).toEqual({
      correctionRateByFood: { Rice: 25 },
      correctionRateByModel: { 'gpt-4o': 10 },
    });
  });
});
