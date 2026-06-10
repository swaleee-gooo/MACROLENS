/**
 * Pure unit conversion + formatting for the imperial/metric display layer (S2).
 *
 * Canonical storage stays 100% metric (`heightCm`, `weightKg`): these helpers
 * convert ONLY at the UI boundary. Anti-drift rule: conversions toward metric
 * (saving) are never rounded; rounding exists only on display, so an
 * untouched re-save never changes the stored kg value.
 *
 * Converter contract: pure functions that assume a valid finite input (>= 0).
 * They never throw and never clamp — input validation (rejecting negatives,
 * empty, non-numeric) stays at the UI layer, exactly like the existing cm/kg
 * fields do.
 */

export type UnitSystem = 'imperial' | 'metric';

const LBS_PER_KG = 2.2046226218;
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

/** Trim a display number to at most one decimal, dropping a trailing ".0". */
function formatAmount(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** kg → lbs, display-rounded to 0.1 lbs. */
export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG * 10) / 10;
}

/** lbs → kg, unrounded (storage direction). */
export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

/**
 * cm → feet + whole inches. Inches are rounded to the nearest integer and a
 * 12-inch result carries into the next foot (e.g. 5 ft 11.6 in → 6 ft 0 in),
 * so 175.26 cm renders as 5'9", never 5'8.9".
 */
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);

  return {
    ft: Math.floor(totalInches / INCHES_PER_FOOT),
    in: totalInches % INCHES_PER_FOOT,
  };
}

/** feet + inches → cm, unrounded (storage direction). */
export function ftInToCm(ft: number, inches: number): number {
  return (ft * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

/** "165.3 lbs" | "75 kg" — weight is always stored in kg, converted on display. */
export function formatWeight(kg: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return `${formatAmount(kgToLbs(kg))} lbs`;
  }

  return `${formatAmount(kg)} kg`;
}

/** "5'9\"" | "175 cm" — height is always stored in cm, converted on display. */
export function formatHeight(cm: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const { ft, in: inches } = cmToFtIn(cm);
    return `${ft}'${inches}"`;
  }

  return `${Math.round(cm)} cm`;
}

/**
 * "1 lb/week" | "0.5 kg/week" — weekly pace presets. The imperial labels use
 * the intentional friendly mapping kg × 2 (0.25/0.5/0.75/1 kg ↔ 0.5/1/1.5/2 lb),
 * NOT the exact factor: the underlying values stay the existing kg presets.
 */
export function formatWeeklyPace(kgPerWeek: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return `${kgPerWeek * 2} lb/week`;
  }

  return `${kgPerWeek} kg/week`;
}
