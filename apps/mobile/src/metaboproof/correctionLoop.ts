import { analyzeMealEvidence } from './proofEngine';
import type { EvidenceLevel, MealAnalysis, MealItem, NutritionSource } from './types';

export type MealItemCorrection = {
  itemId: string;
  label?: string;
  grams?: number;
  source?: NutritionSource;
  evidenceLevel?: EvidenceLevel;
};

export type CorrectionRecord = {
  id: string;
  userId: string;
  mealId: string;
  itemId: string;
  foodLabel: string;
  modelId: string;
  field: 'label' | 'grams' | 'source' | 'portion';
  previousValue: string | number;
  nextValue: string | number;
  correctionType?: string;
  createdAt: string;
};

export type CorrectionRepository = {
  saveCorrection(record: CorrectionRecord): Promise<void>;
  listCorrections(userId: string): Promise<CorrectionRecord[]>;
};

export function applyMealItemCorrection(analysis: MealAnalysis, correction: MealItemCorrection): MealAnalysis {
  const items: MealItem[] = analysis.items.map((item) => {
    if (item.id !== correction.itemId) {
      return item;
    }

    const nextEvidence = correction.evidenceLevel ?? item.evidenceLevel;
    return {
      ...item,
      label: correction.label ?? item.label,
      source: correction.source ?? item.source,
      grams: correction.grams ?? item.grams,
      estimatedGrams: correction.grams !== undefined ? undefined : item.estimatedGrams,
      evidenceLevel: nextEvidence,
    };
  });

  return analyzeMealEvidence({ id: analysis.id, items });
}

export function createCorrectionRepository(initialRecords: CorrectionRecord[] = []): CorrectionRepository {
  const records = [...initialRecords];

  return {
    async saveCorrection(record: CorrectionRecord): Promise<void> {
      records.push(record);
    },
    async listCorrections(userId: string): Promise<CorrectionRecord[]> {
      return records.filter((record) => record.userId === userId);
    },
  };
}

function percentage(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

export function summarizeCorrectionRecords(
  records: CorrectionRecord[],
  totals: {
    totalMealsByFood: Record<string, number>;
    totalScansByModel: Record<string, number>;
  },
) {
  const byFood: Record<string, number> = {};
  const byModel: Record<string, number> = {};

  for (const record of records) {
    byFood[record.foodLabel] = (byFood[record.foodLabel] ?? 0) + 1;
    byModel[record.modelId] = (byModel[record.modelId] ?? 0) + 1;
  }

  return {
    correctionRateByFood: Object.fromEntries(Object.entries(byFood).map(([food, count]) => [food, percentage(count, totals.totalMealsByFood[food] ?? 0)])),
    correctionRateByModel: Object.fromEntries(Object.entries(byModel).map(([model, count]) => [model, percentage(count, totals.totalScansByModel[model] ?? 0)])),
  };
}
