import { describe, expect, it } from 'vitest';
import { createMemoryStorageAdapter } from './mealRepository';
import { createUnitPreferenceRepository } from './unitPreferenceRepository';

const UNIT_SYSTEM_KEY = 'macrolens.unitSystem';

describe('unit preference repository', () => {
  it('defaults to imperial on a fresh install (US market)', async () => {
    const repository = createUnitPreferenceRepository(createMemoryStorageAdapter());

    await expect(repository.getUnitSystem()).resolves.toBe('imperial');
  });

  it('persists the selected unit system across reads', async () => {
    const storage = createMemoryStorageAdapter();
    const repository = createUnitPreferenceRepository(storage);

    await repository.saveUnitSystem('metric');

    await expect(repository.getUnitSystem()).resolves.toBe('metric');
    // A fresh repository over the same storage reads the persisted value.
    await expect(createUnitPreferenceRepository(storage).getUnitSystem()).resolves.toBe('metric');

    await repository.saveUnitSystem('imperial');
    await expect(repository.getUnitSystem()).resolves.toBe('imperial');
  });

  it('falls back to imperial when the stored value is corrupted', async () => {
    const storage = createMemoryStorageAdapter();
    await storage.setItem(UNIT_SYSTEM_KEY, 'fathoms');
    const repository = createUnitPreferenceRepository(storage);

    await expect(repository.getUnitSystem()).resolves.toBe('imperial');
  });
});
