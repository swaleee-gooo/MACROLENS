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
});
