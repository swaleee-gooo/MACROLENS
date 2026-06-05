import { analyzeMealEvidence } from './proofEngine';
import type { EvidenceLevel, MealAnalysis, MealItem, NutritionSource } from './types';

export type VisualCandidate = {
  label: string;
  estimatedGrams?: number;
  confidence: number;
  evidenceLevel?: EvidenceLevel;
};

export type VisualModelOutput = {
  modelId: string;
  candidates: VisualCandidate[];
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type VisionModel = {
  id: string;
  analyzeImage(input: { imageUri: string }): Promise<VisualModelOutput>;
};

export type VisionModelRouter = {
  analyzeImage(input: { imageUri: string }): Promise<VisualModelOutput>;
};

type NutritionResolverLike = {
  resolve(input: { label?: string; barcode?: string }): Promise<NutritionSource | null>;
};

type CostLedgerLike = {
  recordScan(input: { id: string; modelId: string; inputTokens?: number; outputTokens?: number; photoCount: number; createdAt: string }): unknown;
};

function averageConfidence(candidates: VisualCandidate[]): number {
  return candidates.length === 0 ? 0 : candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / candidates.length;
}

export function createVisionModelRouter({
  defaultModel,
  fallbackModel,
  escalationThreshold = 0.65,
}: {
  defaultModel: VisionModel;
  fallbackModel?: VisionModel;
  escalationThreshold?: number;
}): VisionModelRouter {
  return {
    async analyzeImage(input) {
      const first = await defaultModel.analyzeImage(input);
      if (fallbackModel && averageConfidence(first.candidates) < escalationThreshold) {
        return fallbackModel.analyzeImage(input);
      }

      return first;
    },
  };
}

function visualEvidenceLevel(candidate: VisualCandidate): EvidenceLevel {
  return candidate.evidenceLevel === 'RESEARCH_PREDICTED_MASS' ? 'RESEARCH_PREDICTED_MASS' : 'ESTIMATED_VISUAL_ONLY';
}

function fallbackSource(label: string): NutritionSource {
  return {
    provider: 'USER_CUSTOM',
    externalId: `visual:${label.toLowerCase()}`,
    name: label,
    kcalPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
  };
}

export function createVisualNutritionEngine({
  router,
  resolver,
  costLedger,
}: {
  router: VisionModelRouter;
  resolver: NutritionResolverLike;
  costLedger?: CostLedgerLike;
}) {
  return {
    async analyzeImage(input: { id: string; imageUri: string }): Promise<MealAnalysis> {
      const modelOutput = await router.analyzeImage({ imageUri: input.imageUri });
      costLedger?.recordScan({
        id: `${input.id}:${modelOutput.modelId}`,
        modelId: modelOutput.modelId,
        inputTokens: modelOutput.tokenUsage?.inputTokens,
        outputTokens: modelOutput.tokenUsage?.outputTokens,
        photoCount: 1,
        createdAt: new Date().toISOString(),
      });

      const items: MealItem[] = await Promise.all(
        modelOutput.candidates.map(async (candidate, index) => ({
          id: `${input.id}-visual-${index + 1}`,
          label: candidate.label,
          estimatedGrams: candidate.estimatedGrams,
          confidence: candidate.confidence,
          source: (await resolver.resolve({ label: candidate.label })) ?? fallbackSource(candidate.label),
          evidenceLevel: visualEvidenceLevel(candidate),
        })),
      );

      return analyzeMealEvidence({ id: input.id, items });
    },
  };
}
