import { describe, expect, it, vi } from 'vitest';
import type { Meal, UserProfile } from '../domain/types';
import { createMemoryStorageAdapter, createMealRepository } from './mealRepository';
import { createProfileRepository } from './profileRepository';
import { createSyncedMealRepository, createSyncedProfileRepository } from './cloudSyncRepository';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'file://meal.jpg',
  capturedAt: '2026-05-23T12:30:00.000Z',
  mealName: 'Poulet, riz et legumes',
  caloriesEstimate: 506,
  caloriesLow: 430,
  caloriesHigh: 582,
  proteinG: 51,
  carbsG: 57.3,
  fatG: 6.1,
  fiberG: 4.6,
  confidence: 'medium',
  notes: '',
  source: 'estimated',
  items: [],
};

const profile: UserProfile = {
  id: 'local-user',
  goal: 'lose_fat',
  ageRange: '25-34',
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderate',
  targetWeightKg: 74,
  targets: {
    calorieTarget: 2200,
    proteinTargetG: 160,
    carbsTargetG: 220,
    fatTargetG: 70,
    fiberTargetG: 30,
    calorieOverride: null,
    proteinOverrideG: null,
  },
  updatedAt: '2026-05-24T10:00:00.000Z',
};

function createClient(remoteMeals: Meal[] = [], remoteProfile: UserProfile | null = null) {
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: 'token', user: { id: 'auth-user' } } },
    error: null,
  });
  const get = vi.fn(async (table: string) => {
    if (table === 'meals') {
      return { data: remoteMeals.map((payload) => ({ payload })), error: null };
    }

    if (table === 'profiles') {
      return { data: remoteProfile ? [{ payload: remoteProfile }] : [], error: null };
    }

    return { data: [], error: null };
  });
  const upsert = vi.fn().mockResolvedValue({ data: [], error: null });
  const remove = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    auth: { getSession },
    rest: { get, upsert, delete: remove },
  };
}

describe('cloud sync repositories', () => {
  it('lists remote meals, merges them with local meals, and caches the result locally', async () => {
    const storage = createMemoryStorageAdapter();
    const local = createMealRepository(storage);
    await local.saveMeal({ ...meal, id: 'local-meal', capturedAt: '2026-05-22T12:00:00.000Z' });
    const client = createClient([{ ...meal, id: 'remote-meal', userId: 'auth-user', capturedAt: '2026-05-24T12:00:00.000Z' }]);
    const repository = createSyncedMealRepository(local, client);

    const result = await repository.listMeals();

    expect(result.map((savedMeal) => savedMeal.id)).toEqual(['remote-meal', 'local-meal']);
    expect((await local.listMeals()).map((savedMeal) => savedMeal.id)).toEqual(['remote-meal', 'local-meal']);
    expect(client.rest.get).toHaveBeenCalledWith('meals', 'select=payload&order=captured_at.desc');
  });

  it('saves meals locally and upserts a user-owned payload snapshot to Supabase', async () => {
    const local = createMealRepository(createMemoryStorageAdapter());
    const client = createClient();
    const repository = createSyncedMealRepository(local, client);

    await repository.saveMeal(meal);

    expect(await local.listMeals()).toHaveLength(1);
    expect(client.rest.upsert).toHaveBeenCalledWith(
      'meals',
      expect.objectContaining({
        client_id: 'meal-1',
        user_id: 'auth-user',
        payload: expect.objectContaining({ id: 'meal-1', userId: 'auth-user' }),
      }),
      { onConflict: 'user_id,client_id' },
    );
  });

  it('loads remote profile snapshots and saves profile updates to the authenticated user row', async () => {
    const local = createProfileRepository(createMemoryStorageAdapter());
    const client = createClient([], { ...profile, id: 'auth-user' });
    const repository = createSyncedProfileRepository(local, client);

    await expect(repository.getProfile()).resolves.toMatchObject({ id: 'auth-user' });
    await repository.saveProfile(profile);

    expect(client.rest.get).toHaveBeenCalledWith('profiles', 'select=payload&limit=1');
    expect(client.rest.upsert).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({
        id: 'auth-user',
        payload: expect.objectContaining({ id: 'auth-user' }),
      }),
      { onConflict: 'id' },
    );
  });
});
