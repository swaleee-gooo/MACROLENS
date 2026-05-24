import type { Meal } from '../domain/types';

const MEALS_KEY = 'macrolens.meals.v1';

export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
};

export type MealRepository = {
  listMeals(): Promise<Meal[]>;
  saveMeal(meal: Meal): Promise<void>;
  deleteMeal(mealId: string): Promise<void>;
};

async function readMeals(storage: StorageAdapter): Promise<Meal[]> {
  const raw = await storage.getItem(MEALS_KEY);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as Meal[];
  return parsed.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

async function writeMeals(storage: StorageAdapter, meals: Meal[]): Promise<void> {
  await storage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function createMealRepository(storage: StorageAdapter): MealRepository {
  return {
    async listMeals() {
      return readMeals(storage);
    },

    async saveMeal(meal) {
      const meals = await readMeals(storage);
      const withoutExisting = meals.filter((existingMeal) => existingMeal.id !== meal.id);
      await writeMeals(storage, [meal, ...withoutExisting]);
    },

    async deleteMeal(mealId) {
      const meals = await readMeals(storage);
      await writeMeals(
        storage,
        meals.filter((meal) => meal.id !== mealId),
      );
    },
  };
}

export function createAsyncStorageMealRepository(storage: StorageAdapter): MealRepository {
  return createMealRepository(storage);
}

export function createMemoryStorageAdapter(): StorageAdapter {
  const values = new Map<string, string>();

  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}
