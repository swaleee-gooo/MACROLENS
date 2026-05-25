import { describe, expect, it } from 'vitest';
import { createEntitlementRepository } from './entitlementRepository';
import { createMemoryStorageAdapter } from './mealRepository';

describe('entitlement repository', () => {
  it('defaults to locked', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: false,
      source: 'none',
      productId: null,
      expiresAt: null,
      updatedAt: null,
    });
  });

  it('saves and loads a local dev unlock', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await repository.saveEntitlement({
      isPremium: true,
      source: 'local_dev',
      productId: 'local_dev_unlock',
      expiresAt: null,
      updatedAt: '2026-05-24T10:00:00.000Z',
    });

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: true,
      source: 'local_dev',
      productId: 'local_dev_unlock',
      expiresAt: null,
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
  });

  it('normalizes older entitlement records that did not store product metadata', async () => {
    const storage = createMemoryStorageAdapter();
    await storage.setItem(
      'macrolens.entitlement.v1',
      JSON.stringify({
        isPremium: true,
        source: 'local_dev',
        updatedAt: '2026-05-24T10:00:00.000Z',
      }),
    );
    const repository = createEntitlementRepository(storage);

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: true,
      source: 'local_dev',
      productId: null,
      expiresAt: null,
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
  });

  it('saves and loads a store entitlement', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());

    await repository.saveEntitlement({
      isPremium: true,
      source: 'store',
      productId: 'macrolens_pro_annual',
      expiresAt: '2026-06-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: true,
      source: 'store',
      productId: 'macrolens_pro_annual',
      expiresAt: '2026-06-24T10:00:00.000Z',
      updatedAt: '2026-05-24T10:00:00.000Z',
    });
  });

  it('clears entitlement', async () => {
    const repository = createEntitlementRepository(createMemoryStorageAdapter());
    await repository.saveEntitlement({
      isPremium: true,
      source: 'local_dev',
      productId: 'local_dev_unlock',
      expiresAt: null,
      updatedAt: '2026-05-24T10:00:00.000Z',
    });

    await repository.clearEntitlement();

    await expect(repository.getEntitlement()).resolves.toEqual({
      isPremium: false,
      source: 'none',
      productId: null,
      expiresAt: null,
      updatedAt: null,
    });
  });
});
