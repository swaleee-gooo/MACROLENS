import { describe, expect, it, vi } from 'vitest';
import { createMacroLensSupabaseClient } from './client';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('createMacroLensSupabaseClient', () => {
  it('creates an anonymous session and reuses its access token for storage and functions', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'session-token', user: { id: 'user-1' } }))
      .mockResolvedValueOnce(jsonResponse({ Id: 'object-1', Key: 'meal-photos/user-1/meal.jpg' }))
      .mockResolvedValueOnce(jsonResponse({ signedURL: '/object/sign/meal-photos/user-1/meal.jpg?token=signed' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createMacroLensSupabaseClient('https://project.supabase.co/', 'anon-key', fetcher);

    const auth = await client.auth.signInAnonymously();
    const upload = await client.storage.from('meal-photos').upload('user-1/meal.jpg', new ArrayBuffer(1), {
      contentType: 'image/jpeg',
      upsert: false,
    });
    const signedUrl = await client.storage.from('meal-photos').createSignedUrl('user-1/meal.jpg', 600);
    const invoked = await client.functions.invoke('analyze-meal', { body: { imageUrl: signedUrl.data?.signedUrl } });

    expect(auth.data.user?.id).toBe('user-1');
    expect(upload.data?.path).toBe('user-1/meal.jpg');
    expect(signedUrl.data?.signedUrl).toBe('https://project.supabase.co/storage/v1/object/sign/meal-photos/user-1/meal.jpg?token=signed');
    expect(invoked.error).toBeNull();
    expect(fetcher.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      apikey: 'anon-key',
      'x-upsert': 'false',
    });
    expect(fetcher.mock.calls[3][1]?.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      'Content-Type': 'application/json',
    });
  });

  it('returns edge function error payloads through data and context json', async () => {
    const payload = { error: 'non_food_photo', message: 'Photo non reconnue' };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(payload, { status: 422 }));
    const client = createMacroLensSupabaseClient('https://project.supabase.co', 'anon-key', fetcher);

    const result = await client.functions.invoke('analyze-meal', { body: { imageUrl: 'https://cdn.test/image.jpg' } });
    const error = result.error as { context: { json(): Promise<unknown> } };

    expect(result.data).toEqual(payload);
    await expect(error.context.json()).resolves.toEqual(payload);
  });

  it('signs up with email and uses the returned session token for Data API writes', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'email-token', refresh_token: 'refresh-token', user: { id: 'user-1', email: 'you@example.com' } }))
      .mockResolvedValueOnce(jsonResponse([{ id: 'user-1' }]));
    const client = createMacroLensSupabaseClient('https://project.supabase.co/', 'anon-key', fetcher);

    const auth = await client.auth.signUpWithPassword({ email: 'you@example.com', password: 'correct-password' });
    const upsert = await client.rest.upsert('profiles', { id: 'user-1', payload: { goal: 'maintain' } }, { onConflict: 'id' });

    expect(auth.data.user?.id).toBe('user-1');
    expect(upsert.error).toBeNull();
    expect(fetcher.mock.calls[0][0]).toBe('https://project.supabase.co/auth/v1/signup');
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
      email: 'you@example.com',
      password: 'correct-password',
    });
    expect(fetcher.mock.calls[1][0]).toBe('https://project.supabase.co/rest/v1/profiles?on_conflict=id');
    expect(fetcher.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer email-token',
      Prefer: 'resolution=merge-duplicates,return=representation',
    });
  });

  it('signs in, resets password, signs out, and exposes provider auth urls', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'login-token', refresh_token: 'refresh-token', user: { id: 'user-1', email: 'you@example.com' } }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}));
    const client = createMacroLensSupabaseClient('https://project.supabase.co/', 'anon-key', fetcher);

    const login = await client.auth.signInWithPassword({ email: 'you@example.com', password: 'correct-password' });
    const reset = await client.auth.resetPasswordForEmail('you@example.com', { redirectTo: 'macrolens://auth-callback' });
    const signOut = await client.auth.signOut();
    const session = await client.auth.getSession();
    const url = client.auth.getOAuthUrl('google', 'macrolens://auth-callback');

    expect(login.data.session?.access_token).toBe('login-token');
    expect(reset.error).toBeNull();
    expect(signOut.error).toBeNull();
    expect(session.data.session).toBeNull();
    expect(fetcher.mock.calls[0][0]).toBe('https://project.supabase.co/auth/v1/token?grant_type=password');
    expect(fetcher.mock.calls[1][0]).toBe('https://project.supabase.co/auth/v1/recover');
    expect(fetcher.mock.calls[2][0]).toBe('https://project.supabase.co/auth/v1/logout');
    expect(url).toContain('/auth/v1/authorize?provider=google');
    expect(url).toContain('redirect_to=macrolens%3A%2F%2Fauth-callback');
  });

  it('loads the current user with the active session token', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'login-token', refresh_token: 'refresh-token', user: { id: 'user-1' } }))
      .mockResolvedValueOnce(jsonResponse({ id: 'user-1', email: 'you@example.com' }));
    const client = createMacroLensSupabaseClient('https://project.supabase.co/', 'anon-key', fetcher);

    await client.auth.signInWithPassword({ email: 'you@example.com', password: 'correct-password' });
    const user = await client.auth.getUser();

    expect(user.data.user).toEqual({ id: 'user-1', email: 'you@example.com' });
    expect(fetcher.mock.calls[1][0]).toBe('https://project.supabase.co/auth/v1/user');
    expect(fetcher.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer login-token',
    });
  });
});
