import {
  createInitialReviewPromptState,
  initializeReviewPromptState,
  recordReviewPrompt,
  type ReviewPromptState,
} from '../domain/reviewPrompt';
import type { StorageAdapter } from './mealRepository';

const REVIEW_PROMPT_KEY = 'macrolens.reviewPrompt';

export type ReviewPromptRepository = {
  getState(context: { totalMealsSaved: number }): Promise<ReviewPromptState>;
  recordPrompt(milestone: string, now: Date): Promise<ReviewPromptState>;
};

function normalizeReviewPromptState(raw: Partial<ReviewPromptState>): ReviewPromptState {
  return {
    lastPromptedAt: typeof raw.lastPromptedAt === 'string' ? raw.lastPromptedAt : null,
    promptTimestamps: Array.isArray(raw.promptTimestamps)
      ? raw.promptTimestamps.filter((timestamp): timestamp is string => typeof timestamp === 'string')
      : [],
    hasPromptedForMilestone:
      raw.hasPromptedForMilestone && typeof raw.hasPromptedForMilestone === 'object' ? raw.hasPromptedForMilestone : {},
  };
}

async function readStoredState(storage: StorageAdapter): Promise<ReviewPromptState | null> {
  const raw = await storage.getItem(REVIEW_PROMPT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeReviewPromptState(JSON.parse(raw) as Partial<ReviewPromptState>);
  } catch {
    return null;
  }
}

async function writeState(storage: StorageAdapter, state: ReviewPromptState): Promise<void> {
  await storage.setItem(REVIEW_PROMPT_KEY, JSON.stringify(state));
}

export function createReviewPromptRepository(storage: StorageAdapter): ReviewPromptRepository {
  return {
    // Lazy initialization on the FIRST read (no boot migration): when no state
    // exists yet and the user already has more than 3 meals, `third_meal` is
    // marked consumed without prompting so it never fires retroactively.
    async getState(context) {
      const storedState = await readStoredState(storage);
      if (storedState) {
        return storedState;
      }

      const initialState = initializeReviewPromptState(context);
      await writeState(storage, initialState);
      return initialState;
    },

    async recordPrompt(milestone, now) {
      const storedState = await readStoredState(storage);
      const nextState = recordReviewPrompt(storedState ?? createInitialReviewPromptState(), milestone, now);
      await writeState(storage, nextState);
      return nextState;
    },
  };
}
