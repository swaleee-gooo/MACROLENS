import { describe, expect, it } from 'vitest';
import type { MacroLensSession } from '../supabase/client';
import { createMemoryStorageAdapter } from './mealRepository';
import { createAuthSessionRepository } from './authSessionRepository';

const session: MacroLensSession = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  user: { id: 'user-1', email: 'you@example.com' },
};

describe('auth session repository', () => {
  it('persists, restores, and clears a Supabase auth session', async () => {
    const repository = createAuthSessionRepository(createMemoryStorageAdapter());

    await repository.saveSession(session);
    await expect(repository.getSession()).resolves.toEqual(session);

    await repository.clearSession();
    await expect(repository.getSession()).resolves.toBeNull();
  });

  it('falls back to null when stored session data is corrupted', async () => {
    const storage = createMemoryStorageAdapter();
    await storage.setItem('macrolens.auth.session.v1', '{broken');

    await expect(createAuthSessionRepository(storage).getSession()).resolves.toBeNull();
  });
});
