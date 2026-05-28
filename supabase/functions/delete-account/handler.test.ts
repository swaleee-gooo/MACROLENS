import { describe, expect, it, vi } from 'vitest';
import { handleDeleteAccountRequest } from './handler.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `${header}.${payload}.signature`;
}

describe('handleDeleteAccountRequest', () => {
  it('requires an authenticated user', async () => {
    const response = await handleDeleteAccountRequest(new Request('https://example.test/delete-account', { method: 'POST' }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'missing_or_invalid_authorization' });
  });

  it('deletes the authenticated user through the Supabase admin API', async () => {
    const fetchAdmin = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
    const response = await handleDeleteAccountRequest(
      new Request('https://example.test/delete-account', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('user-1')}` },
      }),
      {
        env: {
          get(name) {
            return name === 'SUPABASE_URL' ? 'https://project.supabase.co' : name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'service-role' : undefined;
          },
        },
        fetchAdmin,
      },
    );

    expect(response.status).toBe(200);
    expect(fetchAdmin).toHaveBeenCalledWith('https://project.supabase.co/auth/v1/admin/users/user-1', expect.objectContaining({ method: 'DELETE' }));
  });
});
