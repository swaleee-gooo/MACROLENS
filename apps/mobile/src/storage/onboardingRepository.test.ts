import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from './mealRepository';
import { createOnboardingRepository } from './onboardingRepository';

describe('onboarding repository', () => {
  it('defaults to incomplete', async () => {
    const repository = createOnboardingRepository(createMemoryStorageAdapter());

    await expect(repository.getState()).resolves.toEqual({ isComplete: false });
  });

  it('saves completion', async () => {
    const repository = createOnboardingRepository(createMemoryStorageAdapter());

    await repository.saveState({ isComplete: true, completedAt: '2026-05-24T10:00:00.000Z' });

    await expect(repository.getState()).resolves.toEqual({ isComplete: true, completedAt: '2026-05-24T10:00:00.000Z' });
  });

  it('clears completion', async () => {
    const repository = createOnboardingRepository(createMemoryStorageAdapter());
    await repository.saveState({ isComplete: true, completedAt: '2026-05-24T10:00:00.000Z' });

    await repository.clearState();

    await expect(repository.getState()).resolves.toEqual({ isComplete: false });
  });
});
