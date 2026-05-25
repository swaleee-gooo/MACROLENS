import { describe, expect, it } from 'vitest';
import { buildWeeklyReport, buildWeeklyReportFromMeals } from './weeklyReport';
import type { MacroTargets, Meal } from './types';

describe('buildWeeklyReport', () => {
  it('summarizes adherence over saved meals', () => {
    const report = buildWeeklyReport({
      daysLogged: 4,
      averageCalories: 2100,
      averageProteinG: 142,
      targetCalories: 2200,
      targetProteinG: 150,
    });

    expect(report.title).toBe('Semaine solide');
    expect(report.summary).toBe('4 jours logges, 2100 kcal en moyenne, 142g de proteines.');
    expect(report.nextStep).toBe('Garde le rythme et vise encore 8g de proteines en moyenne.');
  });
});

const targets: MacroTargets = {
  calorieTarget: 2200,
  proteinTargetG: 150,
  carbsTargetG: 240,
  fatTargetG: 70,
  fiberTargetG: 25,
  calorieOverride: null,
  proteinOverrideG: null,
};

function meal(id: string, capturedAt: string, caloriesEstimate: number, proteinG: number): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://test',
    capturedAt,
    mealName: id,
    caloriesEstimate,
    caloriesLow: caloriesEstimate,
    caloriesHigh: caloriesEstimate,
    proteinG,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    confidence: 'high',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildWeeklyReportFromMeals', () => {
  it('builds a report from meals logged in the last seven days', () => {
    const report = buildWeeklyReportFromMeals({
      meals: [
        meal('day-1', '2026-05-25T12:00:00.000Z', 2200, 150),
        meal('day-2', '2026-05-24T12:00:00.000Z', 2000, 130),
        meal('old', '2026-05-10T12:00:00.000Z', 4000, 10),
      ],
      targets,
      todayIsoDate: '2026-05-25',
    });

    expect(report.summary).toBe('2 jours logges, 2100 kcal en moyenne, 140g de proteines.');
  });
});
