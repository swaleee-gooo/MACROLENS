import { describe, expect, it } from 'vitest';
import type { Meal, UserProfile } from '../domain/types';
import {
  buildShareCaption,
  cardDataFromImportedRecipe,
  cardDataFromMeal,
  cardDataFromProgress,
  MACROLENS_APP_STORE_URL,
  macroBarSegments,
} from './shareCardContent';

type TestMeal = Meal & { thumbnailUrl?: string | null };

function meal(overrides: Partial<TestMeal> = {}): Meal {
  return {
    mealName: 'Chicken teriyaki bowl',
    caloriesEstimate: 508.4,
    proteinG: 52,
    carbsG: 56,
    fatG: 6,
    imageUri: 'recipe://imported/tiktok',
    thumbnailUrl: 'https://cdn.example/dish.jpg',
    ...overrides,
  } as Meal;
}

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    goal: 'lose_fat',
    ageRange: '25-34',
    sex: 'prefer_not_to_say',
    heightCm: 178,
    weightKg: 72,
    activityLevel: 'moderate',
    targetWeightKg: null,
    targets: {
      calorieTarget: 2000,
      proteinTargetG: 160,
      carbsTargetG: 220,
      fatTargetG: 70,
      fiberTargetG: 30,
      calorieOverride: null,
      proteinOverrideG: null,
    },
    updatedAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('cardDataFromMeal', () => {
  it('maps a meal into recipe card data, rounding calories and using the thumbnail', () => {
    const data = cardDataFromMeal(meal(), 'recipe');
    expect(data).toMatchObject({
      kind: 'recipe',
      eyebrow: 'Recipe - 1 serving',
      title: 'Chicken teriyaki bowl',
      calories: 508,
      imageUrl: 'https://cdn.example/dish.jpg',
    });
    expect(data.macros).toEqual({ proteinG: 52, carbsG: 56, fatG: 6 });
  });

  it('falls back to the meal photo when there is no thumbnail, and to null for sentinels', () => {
    expect(cardDataFromMeal(meal({ thumbnailUrl: null, imageUri: 'https://cdn.example/plate.jpg' })).imageUrl).toBe(
      'https://cdn.example/plate.jpg',
    );
    expect(cardDataFromMeal(meal({ thumbnailUrl: null, imageUri: 'file:///tmp/plate.jpg' })).imageUrl).toBe(
      'file:///tmp/plate.jpg',
    );
    expect(cardDataFromMeal(meal({ thumbnailUrl: null, imageUri: 'manual://x' })).imageUrl).toBeNull();
  });

  it('defaults to a meal card', () => {
    expect(cardDataFromMeal(meal()).kind).toBe('meal');
    expect(cardDataFromMeal(meal()).eyebrow).toBe("Today's meal");
  });
});

describe('cardDataFromImportedRecipe', () => {
  it('builds a per-serving recipe card from an imported recipe', () => {
    const data = cardDataFromImportedRecipe({
      title: 'Miso salmon bowl',
      summary: '',
      sourceUrl: 'https://example.com/recipe',
      sourcePlatform: 'web',
      sourceAuthor: null,
      imageUrl: 'https://cdn.example/salmon.jpg',
      servings: 2,
      ingredients: [
        { name: 'Salmon', grams: 200, kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
        { name: 'Rice', grams: 300, kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
      ],
      steps: [],
    });

    expect(data).toMatchObject({
      kind: 'recipe',
      eyebrow: 'Recipe - 2 servings',
      title: 'Miso salmon bowl',
      calories: 403,
      imageUrl: 'https://cdn.example/salmon.jpg',
    });
    expect(data.macros.proteinG).toBeCloseTo(24.1, 1);
  });
});

describe('cardDataFromProgress', () => {
  it('builds a progress card from today meals, targets, and profile weight', () => {
    const data = cardDataFromProgress({
      meals: [
        meal({ capturedAt: '2026-06-08T09:00:00.000Z', caloriesEstimate: 500, proteinG: 40, carbsG: 50, fatG: 10 }),
        meal({ capturedAt: '2026-06-07T09:00:00.000Z', caloriesEstimate: 400, proteinG: 30, carbsG: 45, fatG: 8 }),
      ],
      targets: {
        calorieTarget: 2000,
        proteinTargetG: 160,
        carbsTargetG: 220,
        fatTargetG: 70,
        fiberTargetG: 30,
        calorieOverride: null,
        proteinOverrideG: null,
      },
      profile: profile(),
      isoDate: '2026-06-08',
    });

    expect(data).toMatchObject({
      kind: 'progress',
      eyebrow: 'Progress update',
      title: '2-day tracking streak',
      calories: 500,
      progress: {
        streakDays: 2,
        weightKg: 72,
        calorieProgressPct: 25,
        proteinProgressPct: 25,
      },
    });
  });
});

describe('macroBarSegments', () => {
  it('splits the bar by kcal contribution', () => {
    const seg = macroBarSegments({ proteinG: 50, carbsG: 50, fatG: 0 });
    // 200 kcal protein, 200 kcal carbs, 0 fat → 50/50
    expect(seg.proteinPct).toBeCloseTo(50, 5);
    expect(seg.carbsPct).toBeCloseTo(50, 5);
    expect(seg.fatPct).toBe(0);
  });

  it('never divides by zero', () => {
    expect(macroBarSegments({ proteinG: 0, carbsG: 0, fatG: 0 }).proteinPct).toBe(0);
  });
});

describe('buildShareCaption', () => {
  it('includes the dish title and App Store link for a recipe', () => {
    const caption = buildShareCaption('recipe', 'Chicken teriyaki bowl');
    expect(caption).toContain('Chicken teriyaki bowl');
    expect(caption).toContain(MACROLENS_APP_STORE_URL);
  });

  it('returns kind-specific copy with the link for meals and progress', () => {
    expect(buildShareCaption('meal')).toContain(MACROLENS_APP_STORE_URL);
    expect(buildShareCaption('progress')).toContain('🔥');
    expect(buildShareCaption('progress')).toContain(MACROLENS_APP_STORE_URL);
  });
});
