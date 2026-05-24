import type { StorageAdapter } from './mealRepository';

const ONBOARDING_KEY = 'macrolens.onboarding.v1';

export type OnboardingState = {
  isComplete: boolean;
  completedAt?: string;
};

export type OnboardingRepository = {
  getState(): Promise<OnboardingState>;
  saveState(state: OnboardingState): Promise<void>;
  clearState(): Promise<void>;
};

const initialState: OnboardingState = { isComplete: false };

export function createOnboardingRepository(storage: StorageAdapter): OnboardingRepository {
  return {
    async getState() {
      const raw = await storage.getItem(ONBOARDING_KEY);
      if (!raw) {
        return initialState;
      }

      try {
        return JSON.parse(raw) as OnboardingState;
      } catch {
        return initialState;
      }
    },

    async saveState(state) {
      await storage.setItem(ONBOARDING_KEY, JSON.stringify(state));
    },

    async clearState() {
      if (storage.removeItem) {
        await storage.removeItem(ONBOARDING_KEY);
        return;
      }

      await storage.setItem(ONBOARDING_KEY, '');
    },
  };
}
