import { describe, expect, it } from 'vitest';
import { createEntitlementRepository } from './entitlementRepository';
import { createMemoryStorageAdapter } from './mealRepository';

describe('entitlement repository', () => {
  it('defaults to locked', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: false,
      source: 'none',
      updatedAt: null,
    });
  });

  it('saves and loads a local dev unlock', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await repository.saveEntitlement({
      isPremium: true,
      source: 'local_dev',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: true,
      source: 'local_dev',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
  });

  it('clears entitlement', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());
    await repository.saveEntitlement({ isPremium: true, source: 'local_dev', updatedAt: '2026-05-24T10:00:00.000Z' });

    await repository.clearEntitlement();

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: false,
      source: 'none',
      updatedAt: null,
    });
  });
});
