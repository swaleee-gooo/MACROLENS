import type { ImportedRecipe } from '../recipeImport/recipeSchema';
import type { StorageAdapter } from './mealRepository';

/**
 * Local persistence for imported recipes so the user can browse them later in the
 * "My recipes" library and generate a shopping list from any of them. Deduped by
 * source URL (re-importing the same post updates the saved entry).
 */

const RECIPES_KEY = 'macrolens.recipes.v1';

export type SavedRecipe = {
  id: string;
  savedAt: string;
  recipe: ImportedRecipe;
};

export type RecipeRepository = {
  listRecipes(): Promise<SavedRecipe[]>;
  saveRecipe(recipe: ImportedRecipe, savedAt: string): Promise<void>;
  deleteRecipe(id: string): Promise<void>;
  clearRecipes(): Promise<void>;
};

export function recipeStorageId(recipe: ImportedRecipe): string {
  return recipe.sourceUrl?.trim() || `${recipe.sourcePlatform}:${recipe.title.trim().toLowerCase()}`;
}

async function readRecipes(storage: StorageAdapter): Promise<SavedRecipe[]> {
  const raw = await storage.getItem(RECIPES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedRecipe[];
    return Array.isArray(parsed) ? parsed.slice().sort((a, b) => b.savedAt.localeCompare(a.savedAt)) : [];
  } catch {
    return [];
  }
}

async function writeRecipes(storage: StorageAdapter, recipes: SavedRecipe[]): Promise<void> {
  await storage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

export function createRecipeRepository(storage: StorageAdapter): RecipeRepository {
  return {
    async listRecipes() {
      return readRecipes(storage);
    },

    async saveRecipe(recipe, savedAt) {
      const id = recipeStorageId(recipe);
      const recipes = await readRecipes(storage);
      const withoutExisting = recipes.filter((entry) => entry.id !== id);
      await writeRecipes(storage, [{ id, savedAt, recipe }, ...withoutExisting]);
    },

    async deleteRecipe(id) {
      const recipes = await readRecipes(storage);
      await writeRecipes(
        storage,
        recipes.filter((entry) => entry.id !== id),
      );
    },

    async clearRecipes() {
      await writeRecipes(storage, []);
    },
  };
}
