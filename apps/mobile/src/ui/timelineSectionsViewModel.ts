import type { Meal } from '../domain/types';

export type TimelineSection = {
  title: string;
  meals: Meal[];
};

function previousIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function sectionTitle(date: string, todayIsoDate: string): string {
  if (date === todayIsoDate) {
    return "Aujourd'hui";
  }

  if (date === previousIsoDate(todayIsoDate)) {
    return 'Hier';
  }

  return date;
}

export function buildTimelineSections(meals: Meal[], todayIsoDate: string): TimelineSection[] {
  const grouped = new Map<string, Meal[]>();

  meals.forEach((meal) => {
    const date = meal.capturedAt.slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), meal]);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, mealsForDate]) => ({
      title: sectionTitle(date, todayIsoDate),
      meals: mealsForDate.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    }));
}
