import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../domain/types';
import { createMemoryStorageAdapter } from './mealRepository';
import { createProfileRepository } from './profileRepository';

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

describe('profile repository', () => {
  it('saves and loads a profile', async () => {
    const repository = createProfileRepository(createMemoryStorageAdapter());

    await repository.saveProfile(profile);

    await expect(repository.getProfile()).resolves.toEqual(profile);
  });

  it('returns null when no profile exists', async () => {
    const repository = createProfileRepository(createMemoryStorageAdapter());

    await expect(repository.getProfile()).resolves.toBeNull();
  });

  it('clears a saved profile', async () => {
    const repository = createProfileRepository(createMemoryStorageAdapter());
    await repository.saveProfile(profile);

    await repository.clearProfile();

    await expect(repository.getProfile()).resolves.toBeNull();
  });
});
