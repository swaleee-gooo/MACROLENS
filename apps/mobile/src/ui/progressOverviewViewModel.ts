import type { DailySummary } from './dashboardViewModel';

export type ProgressOverviewMetric = {
  label: string;
  value: string;
};

export type ProgressOverview = {
  title: string;
  metrics: ProgressOverviewMetric[];
};

function remaining(value: number, target: number | null): number | null {
  if (target === null) {
    return null;
  }

  return Math.max(0, Math.round(target - value));
}

export function buildProgressOverview(summary: DailySummary): ProgressOverview {
  const caloriesRemaining = remaining(summary.calories, summary.calorieTarget);
  const proteinRemaining = remaining(summary.proteinG, summary.proteinTargetG);

  return {
    title: 'Today tracking',
    metrics: [
      caloriesRemaining === null
        ? { label: 'Tracked calories', value: `${summary.calories} kcal` }
        : { label: 'Calories left', value: `${caloriesRemaining} kcal` },
      proteinRemaining === null
        ? { label: 'Tracked protein', value: `${summary.proteinG} g` }
        : { label: 'Protein left', value: `${proteinRemaining} g` },
      { label: 'Meals logged', value: `${summary.mealCount}` },
    ],
  };
}
