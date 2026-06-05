import { describe, expect, it } from 'vitest';
import { buildPersonalizedPromise } from './onboardingConversion';

describe('buildPersonalizedPromise', () => {
  it('personalizes restaurant-meal weight loss promise around protein target', () => {
    expect(
      buildPersonalizedPromise({
        goal: 'lose_fat',
        friction: 'restaurant_meals',
        proteinTargetG: 150,
      }),
    ).toBe('Scan restaurant meals, correct portions in seconds, and aim for 150g of protein per day.');
  });

  it('personalizes hidden-calorie muscle gain promise around protein target', () => {
    expect(
      buildPersonalizedPromise({
        goal: 'build_muscle',
        friction: 'hidden_calories',
        proteinTargetG: 170,
      }),
    ).toBe('Keep protein high, spot hidden calories, and build meals around 170g of protein per day.');
  });
});
