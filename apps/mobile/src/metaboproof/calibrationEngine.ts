import type { MealItem } from './types';

export type CalibrationSample = {
  id: string;
  userId: string;
  imageHash: string;
  foods: string[];
  predictedKcal: number;
  verifiedKcal: number;
  predictedGrams: number;
  verifiedGrams: number;
  modelId: string;
  createdAt: string;
  kcalError: number;
  portionFactor: number;
};

export function createCalibrationSample(input: Omit<CalibrationSample, 'kcalError' | 'portionFactor'>): CalibrationSample {
  return {
    ...input,
    kcalError: Math.abs(input.predictedKcal - input.verifiedKcal),
    portionFactor: input.predictedGrams > 0 ? input.verifiedGrams / input.predictedGrams : 1,
  };
}

export function calibrationProgress(samples: CalibrationSample[], requiredSamples = 5) {
  const completedSamples = samples.length;
  return {
    requiredSamples,
    completedSamples,
    remainingSamples: Math.max(0, requiredSamples - completedSamples),
    ready: completedSamples >= requiredSamples,
  };
}

function median(values: number[]): number {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return 1;
  }

  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function calculatePersonalPortionFactor(samples: CalibrationSample[]): number {
  const kcalRatios = samples.map((sample) => (sample.predictedKcal > 0 ? sample.verifiedKcal / sample.predictedKcal : 1));
  return Math.round(median(kcalRatios) * 1000) / 1000;
}

export function calibrateVisualItems(items: MealItem[], personalPortionFactor: number): MealItem[] {
  return items.map((item) => ({
    ...item,
    grams: undefined,
    estimatedGrams: item.estimatedGrams === undefined ? undefined : Math.round(item.estimatedGrams * personalPortionFactor * 10) / 10,
    evidenceLevel: 'CALIBRATED_TOTAL_WEIGHT',
  }));
}
