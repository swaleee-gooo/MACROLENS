import { calculateMealStreak } from '../domain/streaks';
import { buildGoalProgress } from '../domain/goalProgress';
import { buildHomeStreakTimeline } from '../domain/homeStreak';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import { buildDailySummary } from './dashboardViewModel';

function progress(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(999, Math.round((value / target) * 100));
}

export function buildPremiumDashboardViewModel(
  meals: Meal[],
  todayIsoDate: string,
  targets: MacroTargets | null,
  profile: UserProfile | null = null,
  goalProgressDays = 90,
) {
  const summary = buildDailySummary(meals, todayIsoDate, targets);
  const calorieTarget = targets?.calorieTarget ?? 0;
  const proteinTarget = targets?.proteinTargetG ?? 0;
  const streakCalendar = buildHomeStreakTimeline(meals, todayIsoDate);

  return {
    dateLabel: 'Aujourd hui',
    streakCalendar,
    goalProgress: profile ? buildGoalProgress(meals, profile, todayIsoDate, goalProgressDays) : null,
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
      target: targets?.carbsTargetG ?? 0,
      progress: targets ? progress(summary.carbsG, targets.carbsTargetG) : 0,
    },
    fat: {
      consumed: summary.fatG,
      target: targets?.fatTargetG ?? 0,
      progress: targets ? progress(summary.fatG, targets.fatTargetG) : 0,
    },
    streakDays: calculateMealStreak(meals, todayIsoDate),
    nextBadge: {
      label: 'Chef Etoile',
      daysRemaining: 3,
    },
  };
}
