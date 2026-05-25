import { roundMacro } from './nutrition';
import type { Meal, UserProfile } from './types';

export type GoalProgressPoint = {
  isoDate: string;
  label: string;
  weightKg: number;
  calories: number;
  logged: boolean;
  isToday: boolean;
};

export type GoalProgress = {
  rangeDays: number;
  startWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number | null;
  progressPercent: number;
  statusLabel: string;
  insight: string;
  points: GoalProgressPoint[];
};

const kcalPerKg = 7700;
const monthLabels = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];

function isoDateAtNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

function shiftIsoDate(isoDate: string, days: number): string {
  const date = isoDateAtNoon(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(isoDate: string): string {
  const date = isoDateAtNoon(isoDate);
  return `${date.getUTCDate()} ${monthLabels[date.getUTCMonth()]}`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function caloriesByDate(meals: Meal[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const meal of meals) {
    const isoDate = meal.capturedAt.slice(0, 10);
    totals.set(isoDate, (totals.get(isoDate) ?? 0) + meal.caloriesEstimate);
  }

  return totals;
}

function progressToTarget(startWeightKg: number, currentWeightKg: number, targetWeightKg: number | null): number {
  if (targetWeightKg === null || targetWeightKg === startWeightKg) {
    return 100;
  }

  const totalDistance = Math.abs(targetWeightKg - startWeightKg);
  const remainingDistance = Math.abs(targetWeightKg - currentWeightKg);
  return clampPercent(((totalDistance - remainingDistance) / totalDistance) * 100);
}

export function buildGoalProgress(meals: Meal[], profile: UserProfile, todayIsoDate: string, rangeDays = 90): GoalProgress {
  const safeRangeDays = Math.max(7, rangeDays);
  const caloriesTarget = profile.targets.calorieTarget;
  const dailyCalories = caloriesByDate(meals);
  const targetWeightKg = profile.targetWeightKg;
  let estimatedWeightKg = profile.weightKg;
  const points: GoalProgressPoint[] = [];
  let loggedDays = 0;

  for (let index = safeRangeDays - 1; index >= 0; index -= 1) {
    const isoDate = shiftIsoDate(todayIsoDate, -index);
    const calories = dailyCalories.get(isoDate) ?? 0;
    const logged = dailyCalories.has(isoDate);

    if (logged) {
      loggedDays += 1;
      estimatedWeightKg += (calories - caloriesTarget) / kcalPerKg;
    }

    points.push({
      isoDate,
      label: formatShortDate(isoDate),
      weightKg: roundMacro(estimatedWeightKg),
      calories: Math.round(calories),
      logged,
      isToday: isoDate === todayIsoDate,
    });
  }

  const currentWeightKg = points.at(-1)?.weightKg ?? profile.weightKg;
  const progressPercent = progressToTarget(profile.weightKg, currentWeightKg, targetWeightKg);
  const targetLabel = targetWeightKg === null ? 'objectif actif' : `${progressPercent}% du goal done`;
  const insight =
    loggedDays === 0
      ? 'Log tes repas pour faire bouger la courbe.'
      : progressPercent >= 80
        ? 'Super regularite. La courbe avance vers ton objectif.'
        : 'Continue a scanner. La regularite fait progresser le goal.';

  return {
    rangeDays: safeRangeDays,
    startWeightKg: roundMacro(profile.weightKg),
    currentWeightKg,
    targetWeightKg,
    progressPercent,
    statusLabel: targetLabel,
    insight,
    points,
  };
}
