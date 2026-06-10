import { describe, expect, it } from 'vitest';
import { cmToFtIn, formatHeight, formatWeight, formatWeeklyPace, ftInToCm, kgToLbs, lbsToKg } from './units';

describe('kgToLbs', () => {
  it('converts kg to lbs rounded to 0.1 for display', () => {
    expect(kgToLbs(75)).toBe(165.3); // 165.34669... → 165.3
    expect(kgToLbs(70)).toBe(154.3); // 154.32358... → 154.3
  });

  it('handles zero', () => {
    expect(kgToLbs(0)).toBe(0);
  });

  it('handles very large values', () => {
    expect(kgToLbs(1000)).toBe(2204.6);
  });
});

describe('lbsToKg', () => {
  it('converts lbs to kg at full precision (no rounding — storage direction)', () => {
    expect(lbsToKg(165)).toBeCloseTo(74.84274105, 8);
    expect(lbsToKg(165)).not.toBe(74.8); // must NOT be display-rounded
  });

  it('handles zero', () => {
    expect(lbsToKg(0)).toBe(0);
  });
});

describe('weight round-trip stability (anti-drift)', () => {
  it('entering 165 lbs, reopening, re-saving untouched does not change stored kg', () => {
    const storedKg = lbsToKg(165); // save: lbs string → kg stored
    const redisplayedLbs = kgToLbs(storedKg); // reopen: display lbs
    expect(redisplayedLbs).toBe(165); // unchanged on screen

    const resavedKg = lbsToKg(redisplayedLbs); // re-save without editing
    expect(resavedKg).toBe(storedKg); // stored kg identical (exact, beyond 0.01)
  });

  it('is stable for decimal entries such as 164.5 lbs', () => {
    const storedKg = lbsToKg(164.5);
    expect(kgToLbs(storedKg)).toBe(164.5);
    expect(lbsToKg(kgToLbs(storedKg))).toBe(storedKg);
  });
});

describe('cmToFtIn', () => {
  it('converts 175.26 cm to exactly 5 ft 9 in (not 5 ft 8.9 in)', () => {
    expect(cmToFtIn(175.26)).toEqual({ ft: 5, in: 9 });
  });

  it('rounds inches to the nearest integer', () => {
    expect(cmToFtIn(175)).toEqual({ ft: 5, in: 9 }); // 68.897 in → 69 in
  });

  it('carries 11.6 in into the next foot (12 in → +1 ft 0 in)', () => {
    // 5 ft 11.6 in = 71.6 in = 181.864 cm → rounds to 72 in → 6'0"
    expect(cmToFtIn(181.864)).toEqual({ ft: 6, in: 0 });
  });

  it('handles zero', () => {
    expect(cmToFtIn(0)).toEqual({ ft: 0, in: 0 });
  });

  it('handles very large values', () => {
    expect(cmToFtIn(2540)).toEqual({ ft: 83, in: 4 }); // 1000 in
  });
});

describe('ftInToCm', () => {
  it('converts 5 ft 9 in to 175.26 cm at full precision (storage direction)', () => {
    expect(ftInToCm(5, 9)).toBeCloseTo(175.26, 10);
  });

  it('handles zero', () => {
    expect(ftInToCm(0, 0)).toBe(0);
  });

  it('round-trips with cmToFtIn for whole-inch heights', () => {
    expect(cmToFtIn(ftInToCm(5, 9))).toEqual({ ft: 5, in: 9 });
    expect(cmToFtIn(ftInToCm(6, 0))).toEqual({ ft: 6, in: 0 });
    expect(cmToFtIn(ftInToCm(4, 11))).toEqual({ ft: 4, in: 11 });
  });
});

describe('converter contract', () => {
  it('passes negative input through without throwing or clamping (rejection is the UI layer’s job)', () => {
    // The existing cm/kg fields validate input before converting; units.ts
    // stays pure math. These calls document that nothing throws or clamps.
    expect(kgToLbs(-1)).toBe(-2.2);
    expect(lbsToKg(-1)).toBeCloseTo(-0.4535923, 6);
    expect(ftInToCm(-1, 0)).toBeCloseTo(-30.48, 10);
  });
});

describe('formatWeight', () => {
  it('formats imperial weight with one decimal', () => {
    expect(formatWeight(75, 'imperial')).toBe('165.3 lbs');
  });

  it('drops the trailing .0 on whole pounds', () => {
    expect(formatWeight(lbsToKg(165), 'imperial')).toBe('165 lbs');
  });

  it('formats metric weight', () => {
    expect(formatWeight(75, 'metric')).toBe('75 kg');
    expect(formatWeight(74.84274105, 'metric')).toBe('74.8 kg');
  });

  it('handles zero in both systems', () => {
    expect(formatWeight(0, 'imperial')).toBe('0 lbs');
    expect(formatWeight(0, 'metric')).toBe('0 kg');
  });
});

describe('formatHeight', () => {
  it('formats imperial height as ft + in', () => {
    expect(formatHeight(175.26, 'imperial')).toBe('5\'9"');
    expect(formatHeight(175, 'imperial')).toBe('5\'9"');
  });

  it('carries rounded inches into the next foot', () => {
    expect(formatHeight(181.864, 'imperial')).toBe('6\'0"');
  });

  it('formats metric height as whole cm', () => {
    expect(formatHeight(175.26, 'metric')).toBe('175 cm');
    expect(formatHeight(180, 'metric')).toBe('180 cm');
  });
});

describe('formatWeeklyPace', () => {
  it('maps the kg presets onto the friendly lb steps (0.25/0.5/0.75/1 ↔ 0.5/1/1.5/2)', () => {
    expect(formatWeeklyPace(0.25, 'imperial')).toBe('0.5 lb/week');
    expect(formatWeeklyPace(0.5, 'imperial')).toBe('1 lb/week');
    expect(formatWeeklyPace(0.75, 'imperial')).toBe('1.5 lb/week');
    expect(formatWeeklyPace(1, 'imperial')).toBe('2 lb/week');
  });

  it('formats the metric presets unchanged', () => {
    expect(formatWeeklyPace(0.25, 'metric')).toBe('0.25 kg/week');
    expect(formatWeeklyPace(0.5, 'metric')).toBe('0.5 kg/week');
    expect(formatWeeklyPace(1, 'metric')).toBe('1 kg/week');
  });
});
