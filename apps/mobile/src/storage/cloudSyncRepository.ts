import type { Meal, NutritionSource, UserProfile } from '../domain/types';
import type { MealRepository } from './mealRepository';
import type { ProfileRepository } from './profileRepository';

type SupabaseSyncClient = {
  auth: {
    getSession(): Promise<{ data: { session: { user?: { id: string } } | null }; error: unknown }>;
  };
  rest: {
    get(table: string, query?: string): Promise<{ data: unknown; error: unknown }>;
    upsert(table: string, body: unknown, options?: { onConflict?: string }): Promise<{ data: unknown; error: unknown }>;
    delete(table: string, query: string): Promise<{ data: unknown; error: unknown }>;
  };
};

type SnapshotRow<T> = {
  payload?: T | null;
};

const mealSources: NutritionSource[] = ['open_food_facts', 'nutrition_label_ocr', 'usda', 'estimated', 'mock'];

function sortMeals(meals: Meal[]): Meal[] {
  return [...meals].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

function userScopedMeal(meal: Meal, userId: string): Meal {
  return {
    ...meal,
    userId,
    items: meal.items.map((item) => ({
      ...item,
      mealId: meal.id,
    })),
  };
}

function userScopedProfile(profile: UserProfile, userId: string): UserProfile {
  return {
    ...profile,
    id: userId,
    updatedAt: new Date().toISOString(),
  };
}

async function authUserId(client: SupabaseSyncClient): Promise<string | null> {
  const session = await client.auth.getSession();
  return session.data.session?.user?.id ?? null;
}

async function replaceLocalMeals(local: MealRepository, meals: Meal[]): Promise<void> {
  await local.clearMeals();
  for (const meal of sortMeals(meals).reverse()) {
    await local.saveMeal(meal);
  }
}

function parsePayloadRows<T>(data: unknown): T[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => (typeof row === 'object' && row !== null ? (row as SnapshotRow<T>).payload : null))
    .filter((payload): payload is T => Boolean(payload));
}

function mergeMeals(localMeals: Meal[], remoteMeals: Meal[]): Meal[] {
  const byId = new Map<string, Meal>();
  localMeals.forEach((meal) => byId.set(meal.id, meal));
  remoteMeals.forEach((meal) => byId.set(meal.id, meal));
  return sortMeals(Array.from(byId.values()));
}

function encodeFilterValue(value: string): string {
  return encodeURIComponent(value).replace(/%2D/g, '-');
}

function databaseSource(source: NutritionSource): NutritionSource {
  return mealSources.includes(source) ? source : 'estimated';
}

function mealSnapshotRow(meal: Meal, userId: string) {
  const scopedMeal = userScopedMeal(meal, userId);
  return {
    user_id: userId,
    client_id: scopedMeal.id,
    image_url: scopedMeal.imageUri,
    captured_at: scopedMeal.capturedAt,
    meal_name: scopedMeal.mealName,
    calories_estimate: Math.max(0, Math.round(scopedMeal.caloriesEstimate)),
    calories_low: Math.max(0, Math.round(scopedMeal.caloriesLow)),
    calories_high: Math.max(Math.round(scopedMeal.caloriesLow), Math.round(scopedMeal.caloriesHigh)),
    protein_g: scopedMeal.proteinG,
    carbs_g: scopedMeal.carbsG,
    fat_g: scopedMeal.fatG,
    fiber_g: scopedMeal.fiberG,
    confidence: scopedMeal.confidence,
    notes: scopedMeal.notes,
    source: databaseSource(scopedMeal.source),
    payload: scopedMeal,
    updated_at: new Date().toISOString(),
  };
}

function profileSnapshotRow(profile: UserProfile, userId: string) {
  const scopedProfile = userScopedProfile(profile, userId);
  return {
    id: userId,
    goal: scopedProfile.goal,
    age_range: scopedProfile.ageRange,
    sex: scopedProfile.sex,
    height_cm: scopedProfile.heightCm,
    weight_kg: scopedProfile.weightKg,
    activity_level: scopedProfile.activityLevel,
    target_weight_kg: scopedProfile.targetWeightKg,
    protein_target_g: scopedProfile.targets.proteinTargetG,
    calorie_target: scopedProfile.targets.calorieTarget,
    targets: scopedProfile.targets,
    payload: scopedProfile,
    updated_at: scopedProfile.updatedAt,
  };
}

export function createSyncedMealRepository(local: MealRepository, client: SupabaseSyncClient): MealRepository {
  return {
    async listMeals() {
      const localMeals = await local.listMeals();
      const userId = await authUserId(client);
      if (!userId) {
        return localMeals;
      }

      const remote = await client.rest.get('meals', 'select=payload&order=captured_at.desc');
      if (remote.error) {
        return localMeals;
      }

      const remoteMeals = parsePayloadRows<Meal>(remote.data);
      const merged = mergeMeals(localMeals, remoteMeals);
      await replaceLocalMeals(local, merged);
      return merged;
    },

    async saveMeal(meal) {
      const userId = await authUserId(client);
      const mealToSave = userId ? userScopedMeal(meal, userId) : meal;
      await local.saveMeal(mealToSave);

      if (userId) {
        await client.rest.upsert('meals', mealSnapshotRow(meal, userId), { onConflict: 'user_id,client_id' });
      }
    },

    async deleteMeal(mealId) {
      await local.deleteMeal(mealId);
      const userId = await authUserId(client);
      if (userId) {
        await client.rest.delete('meals', `user_id=eq.${encodeFilterValue(userId)}&client_id=eq.${encodeFilterValue(mealId)}`);
      }
    },

    async clearMeals() {
      await local.clearMeals();
      const userId = await authUserId(client);
      if (userId) {
        await client.rest.delete('meals', `user_id=eq.${encodeFilterValue(userId)}`);
      }
    },
  };
}

export function createSyncedProfileRepository(local: ProfileRepository, client: SupabaseSyncClient): ProfileRepository {
  return {
    async getProfile() {
      const localProfile = await local.getProfile();
      const userId = await authUserId(client);
      if (!userId) {
        return localProfile;
      }

      const remote = await client.rest.get('profiles', 'select=payload&limit=1');
      if (remote.error) {
        return localProfile ? userScopedProfile(localProfile, userId) : null;
      }

      const [remoteProfile] = parsePayloadRows<UserProfile>(remote.data);
      if (remoteProfile) {
        const scopedProfile = userScopedProfile(remoteProfile, userId);
        await local.saveProfile(scopedProfile);
        return scopedProfile;
      }

      if (localProfile) {
        const scopedProfile = userScopedProfile(localProfile, userId);
        await local.saveProfile(scopedProfile);
        await client.rest.upsert('profiles', profileSnapshotRow(scopedProfile, userId), { onConflict: 'id' });
        return scopedProfile;
      }

      return null;
    },

    async saveProfile(profile) {
      const userId = await authUserId(client);
      const profileToSave = userId ? userScopedProfile(profile, userId) : profile;
      await local.saveProfile(profileToSave);

      if (userId) {
        await client.rest.upsert('profiles', profileSnapshotRow(profileToSave, userId), { onConflict: 'id' });
      }
    },

    async clearProfile() {
      await local.clearProfile();
      const userId = await authUserId(client);
      if (userId) {
        await client.rest.delete('profiles', `id=eq.${encodeFilterValue(userId)}`);
      }
    },
  };
}
