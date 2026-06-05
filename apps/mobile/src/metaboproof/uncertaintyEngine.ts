import type { EvidenceLevel } from './types';

export type KcalIntervalMethod = 'default_visual_margin' | 'default_calibrated_margin' | 'conformal_user_residual_p90' | 'verified_quantity';

export type KcalInterval = {
  min: number;
  max: number;
  margin: number;
  method: KcalIntervalMethod;
};

function isVerifiedEvidence(evidenceLevel: EvidenceLevel): boolean {
  return evidenceLevel.startsWith('VERIFIED_');
}

function percentile90Residual(residuals: number[]): number {
  const sorted = residuals.filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(0.9 * (sorted.length + 1)) - 1));
  return sorted[index] ?? 0;
}

function interval(predictedKcal: number, margin: number, method: KcalIntervalMethod): KcalInterval {
  return {
    min: Math.max(0, Math.round(predictedKcal - margin)),
    max: Math.round(predictedKcal + margin),
    margin: Math.round(margin),
    method,
  };
}

export function calculateKcalInterval({
  predictedKcal,
  evidenceLevel,
  userResiduals,
}: {
  predictedKcal: number;
  evidenceLevel: EvidenceLevel;
  userResiduals: number[];
}): KcalInterval {
  if (isVerifiedEvidence(evidenceLevel)) {
    return interval(predictedKcal, 0, 'verified_quantity');
  }

  if (evidenceLevel === 'CALIBRATED_TOTAL_WEIGHT') {
    if (userResiduals.length >= 10) {
      return interval(predictedKcal, percentile90Residual(userResiduals), 'conformal_user_residual_p90');
    }

    return interval(predictedKcal, predictedKcal * 0.2, 'default_calibrated_margin');
  }

  return interval(predictedKcal, predictedKcal * 0.35, 'default_visual_margin');
}
