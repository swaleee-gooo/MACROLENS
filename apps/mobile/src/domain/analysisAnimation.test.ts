import { describe, expect, it } from 'vitest';
import { buildAnalysisAnimationStages } from './analysisAnimation';

describe('buildAnalysisAnimationStages', () => {
  it('returns a dopamine-style meal analysis sequence', () => {
    const stages = buildAnalysisAnimationStages();

    expect(stages.map((stage) => stage.label)).toEqual([
      'Detecting foods',
      'Estimating portions',
      'Checking hidden calories',
      'Final macros',
    ]);
    expect(stages.at(-1)?.progress).toBe(100);
  });
});
