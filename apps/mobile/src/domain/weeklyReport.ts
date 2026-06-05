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
    title: input.daysLogged >= 3 ? 'Solid week' : 'Week to build',
    summary: `${input.daysLogged} days logged, ${Math.round(input.averageCalories)} kcal on average, ${Math.round(input.averageProteinG)}g of protein.`,
    nextStep: proteinGap > 0 ? `Keep the rhythm and aim for ${proteinGap}g more protein on average.` : 'Your protein is on target, focus on consistency.',
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
