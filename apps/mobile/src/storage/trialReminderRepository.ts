import type { StorageAdapter } from './mealRepository';

const TRIAL_REMINDER_KEY = 'macrolens.trialReminder';

/**
 * Visual + persisted preference only — no notification is scheduled by the app
 * (expo-notifications is not installed). The App Store sends its own trial
 * reminder emails regardless; this records the user's stated preference.
 */
export type TrialReminderRepository = {
  getEnabled(): Promise<boolean>;
  saveEnabled(enabled: boolean): Promise<void>;
};

export function createTrialReminderRepository(storage: StorageAdapter): TrialReminderRepository {
  return {
    async getEnabled() {
      // Default ON — the design's reminder row starts enabled.
      return (await storage.getItem(TRIAL_REMINDER_KEY)) !== 'false';
    },

    async saveEnabled(enabled) {
      await storage.setItem(TRIAL_REMINDER_KEY, enabled ? 'true' : 'false');
    },
  };
}
