export type ProgressChartPointInput = {
  id: string;
  label: string;
  value: number;
  detail: string;
  highlighted: boolean;
};

export type ProgressChartViewModel = {
  isEmpty: boolean;
  points: ProgressChartPointInput[];
  min: number;
  max: number;
  yTicks: number[];
  selected: ProgressChartPointInput & { valueLabel: string };
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

const emptyPoint: ProgressChartPointInput & { valueLabel: string } = {
  id: 'empty',
  label: 'Aucune donnee',
  value: 0,
  detail: 'Log tes repas pour afficher la courbe.',
  highlighted: false,
  valueLabel: '--',
};

export function buildProgressChartViewModel(points: ProgressChartPointInput[], selectedIndex: number | null = null, unit = ''): ProgressChartViewModel {
  if (points.length === 0) {
    return {
      isEmpty: true,
      points,
      min: 0,
      max: 0,
      yTicks: [0, 0, 0],
      selected: emptyPoint,
    };
  }

  const values = points.map((point) => point.value);
  const min = round(Math.min(...values));
  const max = round(Math.max(...values));
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex ?? points.length - 1, points.length - 1));
  const selected = points[safeSelectedIndex];
  const suffix = unit ? ` ${unit}` : '';

  return {
    isEmpty: false,
    points,
    min,
    max,
    yTicks: [min, round((min + max) / 2), max],
    selected: {
      ...selected,
      valueLabel: `${selected.value}${suffix}`,
    },
  };
}
