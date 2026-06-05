import type { PersonalFoodGraph } from './personalFoodGraph';
import type { EvidenceLevel, QuantileEstimate } from './types';

export type PortionEvidenceType =
  | 'single_photo'
  | 'multi_photo_top_side'
  | 'reference_object'
  | 'known_container'
  | 'manual_verified_weight'
  | 'device_depth'
  | 'ar_session';

export type ReferenceObjectKey = 'card' | '330ml_can' | 'teaspoon' | 'tablespoon' | 'custom';

export type ReferenceObject = {
  key: ReferenceObjectKey;
  label: string;
  widthMm?: number;
  heightMm?: number;
  volumeMl?: number;
};

export type PortionEvidence = {
  type: PortionEvidenceType;
  imageUris?: string[];
  referenceObjectKey?: ReferenceObjectKey;
  containerKey?: string;
  verifiedGrams?: number;
  detected?: boolean;
  cancelled?: boolean;
  depthAvailable?: boolean;
  arSessionAvailable?: boolean;
};

export type PortionRuntimeCapabilities = {
  depthAvailable: boolean;
  arSessionAvailable: boolean;
};

export type PortionEstimate = {
  grams: QuantileEstimate;
  evidenceLevel: EvidenceLevel;
  acceptedEvidence: PortionEvidenceType[];
  ignoredEvidence: string[];
  depthAvailable: boolean;
  arAvailable: boolean;
  explanation: string[];
};

export const referenceObjectCatalog: Record<ReferenceObjectKey, ReferenceObject> = {
  card: { key: 'card', label: 'Card-sized object', widthMm: 85.6, heightMm: 54 },
  '330ml_can': { key: '330ml_can', label: '330 ml can', volumeMl: 330 },
  teaspoon: { key: 'teaspoon', label: 'Teaspoon', volumeMl: 5 },
  tablespoon: { key: 'tablespoon', label: 'Tablespoon', volumeMl: 15 },
  custom: { key: 'custom', label: 'Custom reference object' },
};

type RangeFactors = {
  low: number;
  high: number;
};

function roundGram(value: number): number {
  return Math.max(0, Math.round(value));
}

function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function narrower(current: RangeFactors, next: RangeFactors): RangeFactors {
  return {
    low: Math.max(current.low, next.low),
    high: Math.min(current.high, next.high),
  };
}

export function createExpoPortionCapabilities(): PortionRuntimeCapabilities {
  return {
    depthAvailable: false,
    arSessionAvailable: false,
  };
}

export function estimatePortion({
  baseGramsP50,
  evidence,
  graph,
  runtimeCapabilities = createExpoPortionCapabilities(),
}: {
  baseGramsP50: number;
  evidence: PortionEvidence[];
  graph?: PersonalFoodGraph;
  runtimeCapabilities?: PortionRuntimeCapabilities;
}): PortionEstimate {
  let p50 = roundGram(baseGramsP50);
  let factors: RangeFactors = { low: 0.65, high: 1.6 };
  let method: QuantileEstimate['method'] = 'model_range';
  let evidenceLevel: EvidenceLevel = 'ESTIMATED_VISUAL_ONLY';
  const acceptedEvidence: PortionEvidenceType[] = [];
  const ignoredEvidence: string[] = [];
  const explanation: string[] = [];

  for (const item of evidence) {
    if (item.type === 'manual_verified_weight' && item.verifiedGrams !== undefined && item.verifiedGrams > 0) {
      p50 = roundGram(item.verifiedGrams);
      factors = { low: 1, high: 1 };
      method = 'verified_quantity';
      evidenceLevel = 'VERIFIED_PLATE_WEIGHT';
      acceptedEvidence.push(item.type);
      explanation.push('Manual verified weight fixes the portion range.');
      continue;
    }

    if (item.type === 'multi_photo_top_side') {
      if ((item.imageUris?.length ?? 0) >= 2) {
        factors = narrower(factors, { low: 0.8, high: 1.25 });
        acceptedEvidence.push(item.type);
        explanation.push('Top and side photos reduce bowl depth uncertainty.');
      } else {
        ignoredEvidence.push('multi_photo_top_side');
      }
      continue;
    }

    if (item.type === 'single_photo') {
      if ((item.imageUris?.length ?? 0) >= 1) {
        acceptedEvidence.push(item.type);
        explanation.push('Single photo keeps a broad visual portion range.');
      } else {
        ignoredEvidence.push('single_photo');
      }
      continue;
    }

    if (item.type === 'reference_object') {
      const referenceKey = item.referenceObjectKey ?? 'custom';
      if (item.cancelled || !item.detected || !referenceObjectCatalog[referenceKey]) {
        ignoredEvidence.push(`reference_object:${referenceKey}`);
      } else {
        factors = narrower(factors, { low: 0.78, high: 1.28 });
        acceptedEvidence.push(item.type);
        explanation.push('Reference object scale reduces visual size uncertainty.');
      }
      continue;
    }

    if (item.type === 'known_container') {
      const containerKey = normalizeKey(item.containerKey ?? '');
      const container = containerKey ? graph?.containers[containerKey] : undefined;
      if (!container || container.confidence === 'low' || container.verifiedGrams.count < 3) {
        ignoredEvidence.push(`known_container:${containerKey || 'unknown'}`);
      } else {
        p50 = roundGram(container.verifiedGrams.p50);
        factors = { low: container.verifiedGrams.p10 / container.verifiedGrams.p50, high: container.verifiedGrams.p90 / container.verifiedGrams.p50 };
        method = 'calibrated_user';
        evidenceLevel = 'CALIBRATED_TOTAL_WEIGHT';
        acceptedEvidence.push(item.type);
        explanation.push('Known container history narrows the portion range.');
      }
      continue;
    }

    if (item.type === 'device_depth') {
      if (runtimeCapabilities.depthAvailable && item.depthAvailable) {
        factors = narrower(factors, { low: 0.84, high: 1.18 });
        evidenceLevel = 'RESEARCH_PREDICTED_MASS';
        acceptedEvidence.push(item.type);
        explanation.push('Device depth signal reduces geometric uncertainty.');
      } else {
        ignoredEvidence.push('device_depth');
      }
      continue;
    }

    if (item.type === 'ar_session') {
      if (runtimeCapabilities.arSessionAvailable && item.arSessionAvailable) {
        factors = narrower(factors, { low: 0.9, high: 1.12 });
        evidenceLevel = 'RESEARCH_PREDICTED_MASS';
        acceptedEvidence.push(item.type);
        explanation.push('AR session evidence reduces volume uncertainty.');
      } else {
        ignoredEvidence.push('ar_session');
      }
    }
  }

  return {
    grams: {
      p10: roundGram(p50 * factors.low),
      p50,
      p90: roundGram(p50 * factors.high),
      unit: 'g',
      method,
    },
    evidenceLevel,
    acceptedEvidence,
    ignoredEvidence,
    depthAvailable: runtimeCapabilities.depthAvailable && acceptedEvidence.includes('device_depth'),
    arAvailable: runtimeCapabilities.arSessionAvailable && acceptedEvidence.includes('ar_session'),
    explanation,
  };
}
