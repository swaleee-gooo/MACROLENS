import type { FoodSceneAnalysis, HiddenCalorieRisk } from './types';

export type QuestionAnswerType = 'yes_no' | 'single_choice' | 'number' | 'free_text';

export type QuestionCandidate = {
  id: string;
  targetItemId: string | null;
  question: string;
  answerType: QuestionAnswerType;
  uncertaintyDriver: string;
  expectedKcalImpactP90: number;
  confidenceImpact: number;
  priority: number;
};

export type PersonalFoodGraphSnapshot = {
  answeredRiskKeys?: string[];
};

const MIN_QUESTION_IMPACT_KCAL = 50;

function riskKey(risk: HiddenCalorieRisk): string {
  return `${risk.targetItemId ?? 'scene'}:${risk.type}`;
}

function riskTypeWeight(type: string): number {
  const normalized = type.toLowerCase();

  if (normalized.includes('hidden') || normalized.includes('base')) {
    return 1.25;
  }

  if (normalized.includes('sauce') || normalized.includes('oil') || normalized.includes('dressing')) {
    return 1.2;
  }

  if (normalized.includes('portion') || normalized.includes('depth') || normalized.includes('volume')) {
    return 1;
  }

  return 0.9;
}

function inferAnswerType(question: string): QuestionAnswerType {
  return /^(was|were|did|does|do|is|are|has|had|have|can)\b/i.test(question.trim()) ? 'yes_no' : 'free_text';
}

function answerabilityWeight(answerType: QuestionAnswerType): number {
  return answerType === 'yes_no' ? 1.1 : 0.75;
}

function confidenceImpact(priority: number, expectedKcalImpactP90: number): number {
  if (expectedKcalImpactP90 <= 0) {
    return 0;
  }

  return Number(Math.min(1, priority / Math.max(expectedKcalImpactP90, MIN_QUESTION_IMPACT_KCAL)).toFixed(2));
}

function candidateFromRisk(risk: HiddenCalorieRisk, index: number): QuestionCandidate | null {
  const question = risk.answerableQuestion.trim();
  const expectedKcalImpactP90 = risk.kcalImpact.p90;

  if (!question || expectedKcalImpactP90 < MIN_QUESTION_IMPACT_KCAL) {
    return null;
  }

  const answerType = inferAnswerType(question);
  const priority = Math.round(expectedKcalImpactP90 * riskTypeWeight(risk.type) * answerabilityWeight(answerType));

  return {
    id: `${riskKey(risk)}:${index}`,
    targetItemId: risk.targetItemId,
    question,
    answerType,
    uncertaintyDriver: risk.type,
    expectedKcalImpactP90,
    confidenceImpact: confidenceImpact(priority, expectedKcalImpactP90),
    priority,
  };
}

export function selectBestNextQuestion(scene: FoodSceneAnalysis, graph: PersonalFoodGraphSnapshot = {}): QuestionCandidate | null {
  if (scene.evidenceLevel.startsWith('VERIFIED_')) {
    return null;
  }

  const answeredRiskKeys = new Set(graph.answeredRiskKeys ?? []);
  const candidates = scene.hiddenCalorieRisks
    .filter((risk) => !answeredRiskKeys.has(riskKey(risk)))
    .map(candidateFromRisk)
    .filter((candidate): candidate is QuestionCandidate => candidate !== null)
    .sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      if (b.expectedKcalImpactP90 !== a.expectedKcalImpactP90) {
        return b.expectedKcalImpactP90 - a.expectedKcalImpactP90;
      }

      return a.id.localeCompare(b.id);
    });

  return candidates[0] ?? null;
}
