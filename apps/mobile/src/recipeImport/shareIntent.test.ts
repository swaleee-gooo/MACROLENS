import { describe, expect, it } from 'vitest';
import { buildImportDeepLink, parseSharedRecipeUrl } from './shareIntent';

describe('buildImportDeepLink', () => {
  it('encodes the recipe URL into the import deep link', () => {
    expect(buildImportDeepLink('https://vm.tiktok.com/ZGabc/')).toBe(
      'macrolens://import?url=https%3A%2F%2Fvm.tiktok.com%2FZGabc%2F',
    );
  });
});

describe('parseSharedRecipeUrl', () => {
  it('reads the recipe URL from an import deep link', () => {
    expect(parseSharedRecipeUrl('macrolens://import?url=https%3A%2F%2Fvm.tiktok.com%2FZGabc%2F')).toEqual({
      url: 'https://vm.tiktok.com/ZGabc/',
      platform: 'tiktok',
    });
  });

  it('also accepts a text param on the deep link', () => {
    expect(parseSharedRecipeUrl('macrolens://import?text=regarde%20https%3A%2F%2Fyoutu.be%2Fabc')).toEqual({
      url: 'https://youtu.be/abc',
      platform: 'youtube',
    });
  });

  it('parses raw shared text handed over by a share sheet', () => {
    expect(parseSharedRecipeUrl('Trop bon 🤤 https://www.instagram.com/reel/Cabc/')).toEqual({
      url: 'https://www.instagram.com/reel/Cabc/',
      platform: 'instagram',
    });
  });

  it('ignores non-import macrolens deep links such as auth callbacks', () => {
    expect(parseSharedRecipeUrl('macrolens://auth-callback#access_token=xyz')).toBeNull();
  });

  it('returns null for empty or link-free input', () => {
    expect(parseSharedRecipeUrl('')).toBeNull();
    expect(parseSharedRecipeUrl(null)).toBeNull();
    expect(parseSharedRecipeUrl('aucun lien ici')).toBeNull();
  });
});
