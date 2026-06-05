import { describe, expect, it } from 'vitest';
import { selectBestNextQuestion } from './questionEngine';
import type { FoodSceneAnalysis, HiddenCalorieRisk } from './types';

function risk(params: Partial<HiddenCalorieRisk> & { type: string; targetItemId: string; p90: number; question: string }): HiddenCalorieRisk {
  return {
    type: params.type,
    targetItemId: params.targetItemId,
    description: params.description ?? params.type,
    kcalImpact: {
      p10: params.kcalImpact?.p10 ?? 0,
      p50: params.kcalImpact?.p50 ?? Math.round(params.p90 / 2),
      p90: params.p90,
      unit: 'kcal',
      method: 'risk_model',
    },
    evidence: params.evidence ?? [],
    answerableQuestion: params.question,
  };
}

function scene(overrides: Partial<FoodSceneAnalysis> = {}): FoodSceneAnalysis {
  const hiddenRice = risk({
    type: 'hidden_base',
    targetItemId: 'item-rice',
    p90: 320,
    question: 'Was there rice under the toppings?',
  });

  const portion = risk({
    type: 'portion_depth',
    targetItemId: 'item-bowl',
    p90: 170,
    question: 'Was the bowl filled more than halfway?',
  });

  return {
    id: 'scene-1',
    parserVersion: 'food-scene-v1',
    modelId: 'test-model',
    imageInputs: [{ uri: 'file://meal.jpg', role: 'primary' }],
    visualQuality: 'usable',
    portionAmbiguity: 'high',
    evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
    items: [],
    hiddenCalorieRisks: [hiddenRice, portion],
    uncertaintyDrivers: ['hidden_base', 'portion_depth'],
    candidateMeals: [],
    ...overrides,
  };
}

describe('selectBestNextQuestion', () => {
  it('selects the hidden-base question over a generic portion question when it has the largest uncertainty impact', () => {
    const selected = selectBestNextQuestion(scene());

    expect(selected?.question).toBe('Was there rice under the toppings?');
    expect(selected?.uncertaintyDriver).toBe('hidden_base');
    expect(selected?.expectedKcalImpactP90).toBe(320);
  });

  it('selects sauce or dressing when sauce has more impact than visible portion spread', () => {
    const selected = selectBestNextQuestion(
      scene({
        hiddenCalorieRisks: [
          risk({
            type: 'portion_depth',
            targetItemId: 'item-bowl',
            p90: 180,
            question: 'Was the bowl large?',
          }),
          risk({
            type: 'sauce',
            targetItemId: 'item-sauce',
            p90: 260,
            question: 'Was there creamy sauce or dressing?',
          }),
        ],
      }),
    );

    expect(selected?.question).toBe('Was there creamy sauce or dressing?');
    expect(selected?.uncertaintyDriver).toBe('sauce');
  });

  it('does not ask a question for verified evidence', () => {
    expect(selectBestNextQuestion(scene({ evidenceLevel: 'VERIFIED_BARCODE_WEIGHT' }))).toBeNull();
  });

  it('de-prioritizes risks already answered by a strong personal graph pattern', () => {
    const selected = selectBestNextQuestion(scene(), {
      answeredRiskKeys: ['item-rice:hidden_base'],
    });

    expect(selected?.question).toBe('Was the bowl filled more than halfway?');
    expect(selected?.uncertaintyDriver).toBe('portion_depth');
  });
});
