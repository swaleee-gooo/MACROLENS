import { describe, expect, it } from 'vitest';
import { buildAnalysisAnimationStages } from './analysisAnimation';

describe('buildAnalysisAnimationStages', () => {
  it('returns a dopamine-style meal analysis sequence', () => {
    const stages = buildAnalysisAnimationStages();

    expect(stages.map((stage) => stage.label)).toEqual([
      'Detection aliments',
      'Estimation portions',
      'Calories cachees',
      'Macros finales',
    ]);
    expect(stages.at(-1)?.progress).toBe(100);
  });
});
