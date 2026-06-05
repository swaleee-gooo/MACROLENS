import type { Meal, NutritionSource, UserProfile } from '../domain/types';
import type { MealRepository } from './mealRepository';
import type { MetaboProofAnalysisEvent, MetaboProofRepository, PersonalFoodGraphStat, PortionCalibrationRecord } from './metaboProofRepository';
import type { CorrectionRecord } from '../metaboproof/correctionLoop';
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

function mergeCreatedRecords<T extends { id: string; createdAt: string }>(localRecords: T[], remoteRecords: T[]): T[] {
  const byId = new Map<string, T>();
  localRecords.forEach((record) => byId.set(record.id, record));
  remoteRecords.forEach((record) => byId.set(record.id, record));
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mergePersonalGraphStats(localStats: PersonalFoodGraphStat[], remoteStats: PersonalFoodGraphStat[]): PersonalFoodGraphStat[] {
  const byKey = new Map<string, PersonalFoodGraphStat>();
  const keyFor = (stat: PersonalFoodGraphStat) => `${stat.userId}:${stat.graphType}:${stat.graphKey}`;
  localStats.forEach((stat) => byKey.set(keyFor(stat), stat));
  remoteStats.forEach((stat) => byKey.set(keyFor(stat), stat));
  return Array.from(byKey.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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

function analysisEventRow(record: MetaboProofAnalysisEvent, userId: string) {
  const scopedRecord = { ...record, userId };
  return {
    user_id: userId,
    client_id: scopedRecord.id,
    meal_id: scopedRecord.mealId,
    model_id: scopedRecord.modelId,
    provider: scopedRecord.provider,
    image_count: scopedRecord.imageCount,
    scene_payload: scopedRecord.scenePayload,
    token_usage: scopedRecord.tokenUsage ?? null,
    latency_ms: scopedRecord.latencyMs,
    cost_estimate: scopedRecord.costEstimateUsd,
    payload: scopedRecord,
    created_at: scopedRecord.createdAt,
  };
}

function correctionRow(record: CorrectionRecord, userId: string) {
  const scopedRecord = { ...record, userId };
  return {
    user_id: userId,
    client_id: scopedRecord.id,
    meal_id: scopedRecord.mealId,
    item_id: scopedRecord.itemId,
    food_label: scopedRecord.foodLabel,
    field: scopedRecord.field,
    previous_value: scopedRecord.previousValue,
    next_value: scopedRecord.nextValue,
    correction_type: scopedRecord.correctionType ?? scopedRecord.field,
    source_model_id: scopedRecord.modelId,
    payload: scopedRecord,
    created_at: scopedRecord.createdAt,
  };
}

function calibrationRow(record: PortionCalibrationRecord, userId: string) {
  const scopedRecord = { ...record, userId };
  return {
    user_id: userId,
    client_id: scopedRecord.id,
    food_label: scopedRecord.foodLabel,
    container_key: scopedRecord.containerKey,
    estimated_grams: scopedRecord.estimatedGrams,
    verified_grams: scopedRecord.verifiedGrams,
    residual_grams: scopedRecord.residualGrams,
    source: scopedRecord.source,
    payload: scopedRecord,
    created_at: scopedRecord.createdAt,
  };
}

function personalGraphStatRow(record: PersonalFoodGraphStat, userId: string) {
  const scopedRecord = { ...record, userId };
  return {
    user_id: userId,
    graph_key: scopedRecord.graphKey,
    graph_type: scopedRecord.graphType,
    stats_payload: scopedRecord.statsPayload,
    payload: scopedRecord,
    updated_at: scopedRecord.updatedAt,
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

export function createSyncedMetaboProofRepository(local: MetaboProofRepository, client: SupabaseSyncClient): MetaboProofRepository {
  return {
    async saveAnalysisEvent(record) {
      const userId = await authUserId(client);
      const recordToSave = userId ? { ...record, userId } : record;
      await local.saveAnalysisEvent(recordToSave);

      if (userId) {
        await client.rest.upsert('meal_analysis_events', analysisEventRow(recordToSave, userId), { onConflict: 'user_id,client_id' });
      }
    },

    async listAnalysisEvents(requestedUserId) {
      const localRecords = await local.listAnalysisEvents(requestedUserId);
      const userId = await authUserId(client);
      if (!userId) {
        return localRecords;
      }

      const remote = await client.rest.get('meal_analysis_events', 'select=payload&order=created_at.desc');
      if (remote.error) {
        return localRecords;
      }

      const merged = mergeCreatedRecords(localRecords, parsePayloadRows<MetaboProofAnalysisEvent>(remote.data));
      for (const record of merged) {
        await local.saveAnalysisEvent({ ...record, userId });
      }
      return merged;
    },

    async saveCorrection(record) {
      const userId = await authUserId(client);
      const recordToSave = userId ? { ...record, userId } : record;
      await local.saveCorrection(recordToSave);

      if (userId) {
        await client.rest.upsert('meal_corrections', correctionRow(recordToSave, userId), { onConflict: 'user_id,client_id' });
      }
    },

    async listCorrections(requestedUserId) {
      const localRecords = await local.listCorrections(requestedUserId);
      const userId = await authUserId(client);
      if (!userId) {
        return localRecords;
      }

      const remote = await client.rest.get('meal_corrections', 'select=payload&order=created_at.desc');
      if (remote.error) {
        return localRecords;
      }

      const merged = mergeCreatedRecords(localRecords, parsePayloadRows<CorrectionRecord>(remote.data)).map((record) => ({ ...record, userId }));
      await local.replaceCorrections(userId, merged);
      return merged;
    },

    async replaceCorrections(userId, records) {
      await local.replaceCorrections(userId, records);
    },

    async saveCalibration(record) {
      const userId = await authUserId(client);
      const recordToSave = userId ? { ...record, userId } : record;
      await local.saveCalibration(recordToSave);

      if (userId) {
        await client.rest.upsert('portion_calibrations', calibrationRow(recordToSave, userId), { onConflict: 'user_id,client_id' });
      }
    },

    async listCalibrations(requestedUserId) {
      const localRecords = await local.listCalibrations(requestedUserId);
      const userId = await authUserId(client);
      if (!userId) {
        return localRecords;
      }

      const remote = await client.rest.get('portion_calibrations', 'select=payload&order=created_at.desc');
      if (remote.error) {
        return localRecords;
      }

      const merged = mergeCreatedRecords(localRecords, parsePayloadRows<PortionCalibrationRecord>(remote.data));
      for (const record of merged) {
        await local.saveCalibration({ ...record, userId });
      }
      return merged;
    },

    async upsertPersonalGraphStat(record) {
      const userId = await authUserId(client);
      const recordToSave = userId ? { ...record, userId } : record;
      await local.upsertPersonalGraphStat(recordToSave);

      if (userId) {
        await client.rest.upsert('personal_food_stats', personalGraphStatRow(recordToSave, userId), { onConflict: 'user_id,graph_key,graph_type' });
      }
    },

    async listPersonalGraphStats(requestedUserId) {
      const localStats = await local.listPersonalGraphStats(requestedUserId);
      const userId = await authUserId(client);
      if (!userId) {
        return localStats;
      }

      const remote = await client.rest.get('personal_food_stats', 'select=payload&order=updated_at.desc');
      if (remote.error) {
        return localStats;
      }

      const merged = mergePersonalGraphStats(localStats, parsePayloadRows<PersonalFoodGraphStat>(remote.data)).map((record) => ({ ...record, userId }));
      for (const record of merged) {
        await local.upsertPersonalGraphStat(record);
      }
      return merged;
    },

    async clearAll() {
      await local.clearAll();
      const userId = await authUserId(client);
      if (userId) {
        await Promise.all([
          client.rest.delete('meal_analysis_events', `user_id=eq.${encodeFilterValue(userId)}`),
          client.rest.delete('meal_corrections', `user_id=eq.${encodeFilterValue(userId)}`),
          client.rest.delete('portion_calibrations', `user_id=eq.${encodeFilterValue(userId)}`),
          client.rest.delete('personal_food_stats', `user_id=eq.${encodeFilterValue(userId)}`),
        ]);
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
