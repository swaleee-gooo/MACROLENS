import { describe, expect, it } from 'vitest';
import { createTrialReminderRepository } from './trialReminderRepository';

function createFakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    store,
  };
}

describe('trialReminderRepository', () => {
  it('defaults the reminder preference to enabled', async () => {
    const repository = createTrialReminderRepository(createFakeStorage());

    expect(await repository.getEnabled()).toBe(true);
  });

  it('persists and reads back the preference under macrolens.trialReminder', async () => {
    const storage = createFakeStorage();
    const repository = createTrialReminderRepository(storage);

    await repository.saveEnabled(false);
    expect(storage.store.get('macrolens.trialReminder')).toBe('false');
    expect(await repository.getEnabled()).toBe(false);

    await repository.saveEnabled(true);
    expect(await repository.getEnabled()).toBe(true);
  });
});
