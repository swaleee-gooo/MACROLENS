import { describe, expect, it, vi } from 'vitest';
import { runRepeatabilityBenchmark } from './repeatabilityLiveRunner.ts';

function response(caloriesEstimate: number, proteinG: number) {
  return {
    data: {
      meal: {
        mealName: 'Poke bowl saumon',
        caloriesEstimate,
        proteinG,
        carbsG: 92,
        fatG: 34,
        fiberG: 9,
        confidence: 'low',
        source: 'estimated',
      },
    },
    error: null,
  };
}

describe('runRepeatabilityBenchmark', () => {
  it('invokes analyze-meal repeatedly with the same image URL and scores the runs', async () => {
    const invoke = vi.fn().mockResolvedValueOnce(response(910, 39)).mockResolvedValueOnce(response(930, 40)).mockResolvedValueOnce(response(920, 38.5));

    const result = await runRepeatabilityBenchmark(
      { invoke },
      {
        imageUrl: 'https://cdn.example/poke.jpg',
        runCount: 3,
      },
    );

    expect(invoke).toHaveBeenCalledTimes(3);
    expect(invoke).toHaveBeenNthCalledWith(1, 'analyze-meal', { body: { imageUrl: 'https://cdn.example/poke.jpg' } });
    expect(result.report.passed).toBe(true);
    expect(result.runs).toHaveLength(3);
    expect(result.runs[0]).toMatchObject({
      index: 1,
      mealName: 'Poke bowl saumon',
      macros: {
        caloriesEstimate: 910,
        proteinG: 39,
      },
    });
  });

  it('fails the report when repeated protein outputs drift too far', async () => {
    const invoke = vi.fn().mockResolvedValueOnce(response(910, 34)).mockResolvedValueOnce(response(930, 44)).mockResolvedValueOnce(response(920, 39));

    const result = await runRepeatabilityBenchmark(
      { invoke },
      {
        imageUrl: 'https://cdn.example/poke.jpg',
        runCount: 3,
      },
    );

    expect(result.report.passed).toBe(false);
    expect(result.report.failedMetrics).toContain('proteinG');
  });

  it('throws when the edge function returns an error', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'analysis_failed' },
    });

    await expect(
      runRepeatabilityBenchmark(
        { invoke },
        {
          imageUrl: 'https://cdn.example/poke.jpg',
          runCount: 2,
        },
      ),
    ).rejects.toThrow('repeatability_invoke_failed_1');
  });
});
