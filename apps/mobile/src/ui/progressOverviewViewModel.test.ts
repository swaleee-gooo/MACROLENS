import { describe, expect, it } from 'vitest';
import { buildProgressOverview } from './progressOverviewViewModel';
import type { DailySummary } from './dashboardViewModel';

function summary(overrides: Partial<DailySummary> = {}): DailySummary {
  return {
    mealCount: 2,
    calories: 1600,
    proteinG: 95,
    carbsG: 170,
    fatG: 48,
    fiberG: 18,
    calorieTarget: 2200,
    proteinTargetG: 140,
    calorieProgress: 73,
    proteinProgress: 68,
    ...overrides,
  };
}

describe('buildProgressOverview', () => {
  it('formats remaining targets as neutral tracking metrics', () => {
    const overview = buildProgressOverview(summary());

    expect(overview.title).toBe('Suivi du jour');
    expect(overview.metrics).toEqual([
      { label: 'Calories restantes', value: '600 kcal' },
      { label: 'Proteines restantes', value: '45 g' },
      { label: 'Repas logges', value: '2' },
    ]);
  });

  it('caps remaining targets at zero once the user goes over target', () => {
    const overview = buildProgressOverview(
      summary({
        mealCount: 4,
        calories: 2350,
        proteinG: 152,
      }),
    );

    expect(overview.metrics).toEqual([
      { label: 'Calories restantes', value: '0 kcal' },
      { label: 'Proteines restantes', value: '0 g' },
      { label: 'Repas logges', value: '4' },
    ]);
  });

  it('stays useful when targets are missing', () => {
    const overview = buildProgressOverview(summary({ calorieTarget: null, proteinTargetG: null }));

    expect(overview.metrics).toEqual([
      { label: 'Calories suivies', value: '1600 kcal' },
      { label: 'Proteines suivies', value: '95 g' },
      { label: 'Repas logges', value: '2' },
    ]);
  });
});
