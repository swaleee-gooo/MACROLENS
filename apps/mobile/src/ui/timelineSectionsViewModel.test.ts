import { describe, expect, it } from 'vitest';
import { buildTimelineSections } from './timelineSectionsViewModel';
import type { Meal } from '../domain/types';

function meal(id: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://custom',
    capturedAt,
    mealName: id,
    caloriesEstimate: 500,
    caloriesLow: 425,
    caloriesHigh: 575,
    proteinG: 30,
    carbsG: 50,
    fatG: 15,
    fiberG: 5,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildTimelineSections', () => {
  it('groups meals by today and yesterday', () => {
    const sections = buildTimelineSections([meal('today', '2026-05-24T10:00:00.000Z'), meal('yesterday', '2026-05-23T10:00:00.000Z')], '2026-05-24');

    expect(sections.map((section) => section.title)).toEqual(["Aujourd'hui", 'Hier']);
    expect(sections[0].meals[0].id).toBe('today');
  });
});
