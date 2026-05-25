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
    ).toBe('Scanne tes repas au restaurant, corrige les portions en secondes, et vise 150g de proteines par jour.');
  });

  it('personalizes hidden-calorie muscle gain promise around protein target', () => {
    expect(
      buildPersonalizedPromise({
        goal: 'build_muscle',
        friction: 'hidden_calories',
        proteinTargetG: 170,
      }),
    ).toBe('Garde tes proteines hautes, repere les calories cachees, et construis tes repas autour de 170g de proteines par jour.');
  });
});
