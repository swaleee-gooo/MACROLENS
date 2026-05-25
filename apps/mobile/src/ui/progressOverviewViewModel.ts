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
    title: 'Suivi du jour',
    metrics: [
      caloriesRemaining === null
        ? { label: 'Calories suivies', value: `${summary.calories} kcal` }
        : { label: 'Calories restantes', value: `${caloriesRemaining} kcal` },
      proteinRemaining === null
        ? { label: 'Proteines suivies', value: `${summary.proteinG} g` }
        : { label: 'Proteines restantes', value: `${proteinRemaining} g` },
      { label: 'Repas logges', value: `${summary.mealCount}` },
    ],
  };
}
