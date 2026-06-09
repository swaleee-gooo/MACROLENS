import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRecipeThumbnailUrl, isTikTokShortLink, pickOEmbedThumbnail, youtubeThumbnailUrl } from './recipeThumbnail';

describe('youtubeThumbnailUrl', () => {
  it('builds a deterministic thumbnail from watch, short and youtu.be links', () => {
    expect(youtubeThumbnailUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(youtubeThumbnailUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(youtubeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('returns null for non-youtube or malformed ids', () => {
    expect(youtubeThumbnailUrl('https://vm.tiktok.com/ZGabc/')).toBeNull();
    expect(youtubeThumbnailUrl('https://www.youtube.com/watch?v=short')).toBeNull();
  });
});

describe('isTikTokShortLink', () => {
  it('detects vm/vt short links only', () => {
    expect(isTikTokShortLink('https://vm.tiktok.com/ZGabc/')).toBe(true);
    expect(isTikTokShortLink('https://vt.tiktok.com/ZGabc/')).toBe(true);
    expect(isTikTokShortLink('https://www.tiktok.com/@chef/video/123')).toBe(false);
  });
});

describe('pickOEmbedThumbnail', () => {
  it('returns an https thumbnail and rejects anything else', () => {
    expect(pickOEmbedThumbnail({ thumbnail_url: 'https://cdn.tiktok/thumb.jpg' })).toBe('https://cdn.tiktok/thumb.jpg');
    expect(pickOEmbedThumbnail({ thumbnail_url: 'not-a-url' })).toBeNull();
    expect(pickOEmbedThumbnail({})).toBeNull();
    expect(pickOEmbedThumbnail(null)).toBeNull();
  });
});

describe('fetchRecipeThumbnailUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the YouTube thumbnail without any network call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchRecipeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ')).resolves.toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves a TikTok thumbnail from the oEmbed endpoint', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('https://www.tiktok.com/oembed')) {
        return { ok: true, json: async () => ({ thumbnail_url: 'https://cdn.tiktok/thumb.jpg' }) } as Response;
      }
      throw new Error(`unexpected_fetch_${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRecipeThumbnailUrl('https://www.tiktok.com/@chef/video/123')).resolves.toBe('https://cdn.tiktok/thumb.jpg');
  });

  it('returns null for unsupported platforms', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchRecipeThumbnailUrl('https://example.com/recipe')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to null when the oEmbed call fails', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response);
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchRecipeThumbnailUrl('https://www.tiktok.com/@chef/video/123')).resolves.toBeNull();
  });
});
