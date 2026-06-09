import { z } from 'zod';

/**
 * Schema for a recipe extracted from a social/web link (TikTok, Instagram Reels,
 * YouTube Shorts, or a recipe page). The extraction service (mock or remote edge
 * function) returns this exact shape, so the client can validate it before the
 * user reviews and saves it as a meal.
 *
 * Honesty note: every ingredient carries per-100g nutrition so totals are pure
 * arithmetic, but the grams themselves are AI-estimated from a caption/thumbnail.
 * The meal is therefore saved at `ESTIMATED_VISUAL_ONLY` evidence — never
 * "verified" — to stay aligned with the Clinical Trust design system.
 */

export const recipePlatformSchema = z.enum(['tiktok', 'instagram', 'youtube', 'web']);

export const importedRecipeIngredientSchema = z.object({
  name: z.string().min(1),
  grams: z.number().positive(),
  kcalPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative(),
  carbsPer100g: z.number().nonnegative(),
  fatPer100g: z.number().nonnegative(),
});

export const importedRecipeSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(''),
  sourceUrl: z.string().min(1),
  sourcePlatform: recipePlatformSchema,
  sourceAuthor: z.string().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  servings: z.number().int().positive().default(1),
  ingredients: z.array(importedRecipeIngredientSchema).min(1),
  steps: z.array(z.string().min(1)).default([]),
  /**
   * Calories per serving as explicitly stated by the creator in the post/caption
   * (e.g. "508 kcal per bowl"). When present, we trust this over the per-ingredient
   * sum and anchor the recipe to it. `null` when the post never states a number.
   */
  statedCaloriesPerServing: z.number().positive().nullable().default(null),
});

export type RecipePlatform = z.infer<typeof recipePlatformSchema>;
export type ImportedRecipeIngredient = z.infer<typeof importedRecipeIngredientSchema>;
export type ImportedRecipe = z.infer<typeof importedRecipeSchema>;

export type ExtractRecipeInput = {
  url: string;
  userId: string;
};

export type RecipeImportService = {
  extractRecipeFromUrl(input: ExtractRecipeInput): Promise<ImportedRecipe>;
};
