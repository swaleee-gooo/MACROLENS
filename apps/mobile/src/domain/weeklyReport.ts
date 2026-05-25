import type { MacroTargets, Meal } from './types';

type WeeklyReportInput = {
  daysLogged: number;
  averageCalories: number;
  averageProteinG: number;
  targetCalories: number;
  targetProteinG: number;
};

export type WeeklyReport = {
  title: string;
  summary: string;
  nextStep: string;
};

export function buildWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const proteinGap = Math.max(0, Math.round(input.targetProteinG - input.averageProteinG));

  return {
    title: input.daysLogged >= 3 ? 'Semaine solide' : 'Semaine a construire',
    summary: `${input.daysLogged} jours logges, ${Math.round(input.averageCalories)} kcal en moyenne, ${Math.round(input.averageProteinG)}g de proteines.`,
    nextStep: proteinGap > 0 ? `Garde le rythme et vise encore ${proteinGap}g de proteines en moyenne.` : 'Tes proteines sont dans la cible, concentre-toi sur la regularite.',
  };
}

type WeeklyReportFromMealsInput = {
  meals: Meal[];
  targets: MacroTargets;
  todayIsoDate: string;
};

function dateNDaysAgo(todayIsoDate: string, daysAgo: number): string {
  const date = new Date(`${todayIsoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function buildWeeklyReportFromMeals({ meals, targets, todayIsoDate }: WeeklyReportFromMealsInput): WeeklyReport {
  const allowedDates = new Set(Array.from({ length: 7 }, (_, index) => dateNDaysAgo(todayIsoDate, index)));
  const weekMeals = meals.filter((meal) => allowedDates.has(meal.capturedAt.slice(0, 10)));
  const loggedDates = new Set(weekMeals.map((meal) => meal.capturedAt.slice(0, 10)));
  const daysLogged = loggedDates.size;
  const divisor = Math.max(1, daysLogged);
  const totalCalories = weekMeals.reduce((sum, meal) => sum + meal.caloriesEstimate, 0);
  const totalProteinG = weekMeals.reduce((sum, meal) => sum + meal.proteinG, 0);

  return buildWeeklyReport({
    daysLogged,
    averageCalories: totalCalories / divisor,
    averageProteinG: totalProteinG / divisor,
    targetCalories: targets.calorieTarget,
    targetProteinG: targets.proteinTargetG,
  });
}
