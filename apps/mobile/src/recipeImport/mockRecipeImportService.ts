import { detectRecipePlatform } from './recipeUrl';
import { importedRecipeSchema, type RecipeImportService } from './recipeSchema';

/**
 * Deterministic offline recipe used when the app runs in mock analysis mode
 * (Expo Go / no Supabase). Like the mock meal analyzer, it returns a fixed,
 * believable recipe so the whole Import → Review → Save flow is demoable without
 * a backend. The platform is still read from the URL so the UI feels real.
 */
export function createMockRecipeImportService(): RecipeImportService {
  return {
    async extractRecipeFromUrl({ url }) {
      const platform = detectRecipePlatform(url);

      return importedRecipeSchema.parse({
        title: 'Bol de poulet teriyaki',
        summary: 'Bol protéiné viral : poulet teriyaki, riz et légumes croquants.',
        sourceUrl: url,
        sourcePlatform: platform,
        sourceAuthor: null,
        imageUrl: null,
        servings: 2,
        ingredients: [
          { name: 'Blanc de poulet', grams: 300, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
          { name: 'Riz cuit', grams: 400, kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
          { name: 'Sauce teriyaki', grams: 60, kcalPer100g: 130, proteinPer100g: 4, carbsPer100g: 28, fatPer100g: 0 },
          { name: 'Brocoli', grams: 150, kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
          { name: 'Huile de sésame', grams: 15, kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
        ],
        steps: [
          'Couper le poulet en cubes et le saisir à feu vif.',
          'Ajouter la sauce teriyaki et laisser caraméliser 2 minutes.',
          'Cuire le riz et la vapeur de brocoli en parallèle.',
          'Assembler le bol et arroser d’un filet d’huile de sésame.',
        ],
      });
    },
  };
}
