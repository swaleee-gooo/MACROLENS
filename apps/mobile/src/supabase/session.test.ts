import { describe, expect, it, vi } from 'vitest';
import { ensureAnonymousUserId } from './session';

describe('ensureAnonymousUserId', () => {
  it('reuses an existing session user id', async () => {
    const signInAnonymously = vi.fn();

    await expect(
      ensureAnonymousUserId({
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'existing-user' } } }, error: null }),
        signInAnonymously,
      }),
    ).resolves.toBe('existing-user');

    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates an anonymous user when no session exists', async () => {
    await expect(
      ensureAnonymousUserId({
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'anonymous-user' } }, user: { id: 'anonymous-user' } },
          error: null,
        }),
      }),
    ).resolves.toBe('anonymous-user');
  });
});
