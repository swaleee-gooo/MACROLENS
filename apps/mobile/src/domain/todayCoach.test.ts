import { describe, expect, it } from 'vitest';
import { buildTodayCoach } from './todayCoach';

describe('buildTodayCoach', () => {
  it('prioritizes protein when protein remaining is high', () => {
    const coach = buildTodayCoach({
      consumed: { calories: 1300, proteinG: 70, carbsG: 140, fatG: 45, fiberG: 15 },
      targets: { calories: 2200, proteinG: 150, carbsG: 240, fatG: 70, fiberG: 25 },
    });

    expect(coach.headline).toBe('Priorite proteines');
    expect(coach.action).toBe('Ajoute un repas avec 40-60g de proteines et garde les lipides moderes.');
  });
});
