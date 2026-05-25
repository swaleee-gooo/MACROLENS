import { describe, expect, it } from 'vitest';
import { buildHomeStreakCalendar } from './homeStreak';
import type { Meal } from './types';

function meal(id: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: 500,
    caloriesLow: 450,
    caloriesHigh: 550,
    proteinG: 30,
    carbsG: 40,
    fatG: 15,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildHomeStreakCalendar', () => {
  it('builds the current week with meal state and streak count', () => {
    const calendar = buildHomeStreakCalendar(
      [meal('today', '2026-05-27T12:00:00.000Z'), meal('yesterday', '2026-05-26T12:00:00.000Z')],
      '2026-05-27',
    );

    expect(calendar.streakDays).toBe(2);
    expect(calendar.days.map((day) => day.isoDate)).toEqual([
      '2026-05-25',
      '2026-05-26',
      '2026-05-27',
      '2026-05-28',
      '2026-05-29',
      '2026-05-30',
      '2026-05-31',
    ]);
    expect(calendar.days[1].hasMeal).toBe(true);
    expect(calendar.days[2]).toMatchObject({ dayOfMonth: 27, hasMeal: true, isToday: true });
    expect(calendar.days[3].isFuture).toBe(true);
  });
});
