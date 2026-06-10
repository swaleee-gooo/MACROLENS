import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from './mealRepository';
import { createReviewPromptRepository } from './reviewPromptRepository';

const REVIEW_PROMPT_KEY = 'macrolens.reviewPrompt';

describe('review prompt repository', () => {
  it('defaults to a fresh state for a new install', async () => {
    const repository = createReviewPromptRepository(createMemoryStorageAdapter());

    await expect(repository.getState({ totalMealsSaved: 0 })).resolves.toEqual({
      lastPromptedAt: null,
      promptTimestamps: [],
      hasPromptedForMilestone: {},
    });
  });

  it('lazily consumes third_meal on first read when the user already has more than 3 meals', async () => {
    const storage = createMemoryStorageAdapter();
    const repository = createReviewPromptRepository(storage);

    await expect(repository.getState({ totalMealsSaved: 9 })).resolves.toEqual({
      lastPromptedAt: null,
      promptTimestamps: [],
      hasPromptedForMilestone: { third_meal: true },
    });

    // The initialized state is persisted: later reads keep the consumed
    // milestone even if the meal count context changes.
    const persisted = await storage.getItem(REVIEW_PROMPT_KEY);
    expect(persisted).not.toBeNull();
    await expect(repository.getState({ totalMealsSaved: 0 })).resolves.toEqual({
      lastPromptedAt: null,
      promptTimestamps: [],
      hasPromptedForMilestone: { third_meal: true },
    });
  });

  it('does not consume third_meal on first read at exactly 3 meals', async () => {
    const repository = createReviewPromptRepository(createMemoryStorageAdapter());

    await expect(repository.getState({ totalMealsSaved: 3 })).resolves.toEqual({
      lastPromptedAt: null,
      promptTimestamps: [],
      hasPromptedForMilestone: {},
    });
  });

  it('persists recorded prompts across reads', async () => {
    const storage = createMemoryStorageAdapter();
    const repository = createReviewPromptRepository(storage);
    await repository.getState({ totalMealsSaved: 3 });

    await repository.recordPrompt('third_meal', new Date('2026-06-10T12:00:00.000Z'));

    await expect(createReviewPromptRepository(storage).getState({ totalMealsSaved: 4 })).resolves.toEqual({
      lastPromptedAt: '2026-06-10T12:00:00.000Z',
      promptTimestamps: ['2026-06-10T12:00:00.000Z'],
      hasPromptedForMilestone: { third_meal: true },
    });
  });

  it('normalizes corrupted stored state back to defaults', async () => {
    const storage = createMemoryStorageAdapter();
    await storage.setItem(REVIEW_PROMPT_KEY, 'not-json');
    const repository = createReviewPromptRepository(storage);

    await expect(repository.getState({ totalMealsSaved: 1 })).resolves.toEqual({
      lastPromptedAt: null,
      promptTimestamps: [],
      hasPromptedForMilestone: {},
    });
  });
});
