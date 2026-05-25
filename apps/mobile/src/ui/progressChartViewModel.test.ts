import { describe, expect, it } from 'vitest';
import { buildProgressChartViewModel } from './progressChartViewModel';

describe('buildProgressChartViewModel', () => {
  it('creates stable labels and selected tooltip data', () => {
    const vm = buildProgressChartViewModel(
      [
        { id: '2026-05-23', label: '23 mai', value: 80, detail: '2100 kcal loggees', highlighted: false },
        { id: '2026-05-24', label: '24 mai', value: 79.8, detail: '1900 kcal loggees', highlighted: true },
        { id: '2026-05-25', label: '25 mai', value: 79.5, detail: '1800 kcal loggees', highlighted: true },
      ],
      1,
      'kg',
    );

    expect(vm.selected.label).toBe('24 mai');
    expect(vm.selected.valueLabel).toBe('79.8 kg');
    expect(vm.selected.detail).toBe('1900 kcal loggees');
    expect(vm.yTicks.length).toBe(3);
  });

  it('handles empty chart data without blank rendering', () => {
    const vm = buildProgressChartViewModel([], null, 'kg');

    expect(vm.isEmpty).toBe(true);
    expect(vm.selected.label).toBe('Aucune donnee');
  });
});
