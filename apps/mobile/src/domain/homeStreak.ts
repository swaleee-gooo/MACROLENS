import type { Meal } from './types';
import { calculateMealStreak } from './streaks';

export type HomeStreakDay = {
  isoDate: string;
  weekdayLabel: string;
  dayOfMonth: number;
  hasMeal: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type HomeStreakCalendar = {
  streakDays: number;
  days: HomeStreakDay[];
};

export type HomeStreakTimelineOptions = {
  daysBefore: number;
  daysAfter: number;
};

const weekdayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function isoDateAtNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

function shiftIsoDate(isoDate: string, days: number): string {
  const date = isoDateAtNoon(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayForWeek(isoDate: string): string {
  const date = isoDateAtNoon(isoDate);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return shiftIsoDate(isoDate, offset);
}

export function buildHomeStreakCalendar(meals: Meal[], todayIsoDate: string): HomeStreakCalendar {
  const daysWithMeals = new Set(meals.map((meal) => meal.capturedAt.slice(0, 10)));
  const monday = mondayForWeek(todayIsoDate);

  return {
    streakDays: calculateMealStreak(meals, todayIsoDate),
    days: Array.from({ length: 7 }, (_, index) => {
      const isoDate = shiftIsoDate(monday, index);
      const date = isoDateAtNoon(isoDate);

      return {
        isoDate,
        weekdayLabel: weekdayLabels[date.getUTCDay()],
        dayOfMonth: date.getUTCDate(),
        hasMeal: daysWithMeals.has(isoDate),
        isToday: isoDate === todayIsoDate,
        isFuture: isoDate > todayIsoDate,
      };
    }),
  };
}

export function buildHomeStreakTimeline(
  meals: Meal[],
  todayIsoDate: string,
  options: HomeStreakTimelineOptions = { daysBefore: 21, daysAfter: 7 },
): HomeStreakCalendar {
  const daysWithMeals = new Set(meals.map((meal) => meal.capturedAt.slice(0, 10)));
  const totalDays = Math.max(1, options.daysBefore + options.daysAfter + 1);

  return {
    streakDays: calculateMealStreak(meals, todayIsoDate),
    days: Array.from({ length: totalDays }, (_, index) => {
      const offset = index - options.daysBefore;
      const isoDate = shiftIsoDate(todayIsoDate, offset);
      const date = isoDateAtNoon(isoDate);

      return {
        isoDate,
        weekdayLabel: weekdayLabels[date.getUTCDay()],
        dayOfMonth: date.getUTCDate(),
        hasMeal: daysWithMeals.has(isoDate),
        isToday: isoDate === todayIsoDate,
        isFuture: isoDate > todayIsoDate,
      };
    }),
  };
}
