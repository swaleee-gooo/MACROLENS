import type { MacroTargets, Meal } from '../domain/types';
import { buildDailySummary } from './dashboardViewModel';

const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const monthLabels = ['jan', 'fev', 'mars', 'avr', 'mai', 'juin', 'juil', 'aout', 'sep', 'oct', 'nov', 'dec'];

function progress(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(999, Math.round((value / target) * 100));
}

function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatSelectedDay(isoDate: string, todayIsoDate: string): string {
  if (isoDate === todayIsoDate) {
    return "Aujourd'hui";
  }

  if (isoDate === shiftIsoDate(todayIsoDate, -1)) {
    return 'Hier';
  }

  const date = new Date(`${isoDate}T12:00:00.000Z`);
  return `${weekdayLabels[date.getUTCDay()]} ${date.getUTCDate()} ${monthLabels[date.getUTCMonth()]}`;
}

export function buildDayReviewViewModel(meals: Meal[], selectedIsoDate: string, todayIsoDate: string, targets: MacroTargets | null = null) {
  const summary = buildDailySummary(meals, selectedIsoDate, targets);
  const mealsForDate = meals
    .filter((meal) => meal.capturedAt.startsWith(selectedIsoDate))
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const calorieTarget = targets?.calorieTarget ?? 0;
  const proteinTarget = targets?.proteinTargetG ?? 0;
  const carbsTarget = targets?.carbsTargetG ?? 0;
  const fatTarget = targets?.fatTargetG ?? 0;

  return {
    isoDate: selectedIsoDate,
    isToday: selectedIsoDate === todayIsoDate,
    subtitle: formatSelectedDay(selectedIsoDate, todayIsoDate),
    mealCount: mealsForDate.length,
    meals: mealsForDate,
    calories: {
      consumed: summary.calories,
      target: calorieTarget,
      remaining: Math.max(0, calorieTarget - summary.calories),
      progress: targets ? progress(summary.calories, calorieTarget) : 0,
    },
    protein: {
      consumed: summary.proteinG,
      target: proteinTarget,
      progress: targets ? progress(summary.proteinG, proteinTarget) : 0,
    },
    carbs: {
      consumed: summary.carbsG,
      target: carbsTarget,
      progress: targets ? progress(summary.carbsG, carbsTarget) : 0,
    },
    fat: {
      consumed: summary.fatG,
      target: fatTarget,
      progress: targets ? progress(summary.fatG, fatTarget) : 0,
    },
  };
}
