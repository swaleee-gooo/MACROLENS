import { describe, expect, it, vi } from 'vitest';
import { createManualMacroMeal } from './manualMeal';

describe('createManualMacroMeal', () => {
  it('creates a valid manual meal with one food item', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1779612000000);

    const meal = createManualMacroMeal({
      userId: 'local-user',
      name: 'Bol maison',
      calories: 640,
      proteinG: 42,
      carbsG: 70,
      fatG: 18,
      fiberG: 9,
      capturedAt: '2026-05-24T12:00:00.000Z',
    });

    expect(meal.id).toBe('manual-1779612000000');
    expect(meal.mealName).toBe('Bol maison');
    expect(meal.imageUri).toBe('manual://custom');
    expect(meal.caloriesEstimate).toBe(640);
    expect(meal.caloriesLow).toBe(544);
    expect(meal.caloriesHigh).toBe(736);
    expect(meal.proteinG).toBe(42);
    expect(meal.confidence).toBe('low');
    expect(meal.items).toHaveLength(1);
    expect(meal.items[0].dataSource).toBe('estimated');
  });

  it('defaults optional macros to zero', () => {
    const meal = createManualMacroMeal({
      userId: 'local-user',
      name: 'Cafe',
      calories: 5,
    });

    expect(meal.proteinG).toBe(0);
    expect(meal.carbsG).toBe(0);
    expect(meal.fatG).toBe(0);
    expect(meal.fiberG).toBe(0);
  });
});
