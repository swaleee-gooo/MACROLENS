import { describe, expect, it } from 'vitest';
import { detectRecipePlatform, extractFirstUrl, normalizeRecipeUrl, recipePlatformLabel } from './recipeUrl';

describe('extractFirstUrl', () => {
  it('pulls the URL out of a messy TikTok share payload', () => {
    expect(extractFirstUrl('Regarde cette recette 🤤 https://vm.tiktok.com/ZGabc123/ trop bon')).toBe(
      'https://vm.tiktok.com/ZGabc123/',
    );
  });

  it('strips trailing punctuation that clings to a pasted link', () => {
    expect(extractFirstUrl('voici (https://www.tiktok.com/@chef/video/42).')).toBe('https://www.tiktok.com/@chef/video/42');
  });

  it('returns null when there is no URL', () => {
    expect(extractFirstUrl('juste du texte sans lien')).toBeNull();
  });
});

describe('detectRecipePlatform', () => {
  it('classifies TikTok hosts including short domains', () => {
    expect(detectRecipePlatform('https://www.tiktok.com/@chef/video/42')).toBe('tiktok');
    expect(detectRecipePlatform('https://vm.tiktok.com/ZGabc/')).toBe('tiktok');
    expect(detectRecipePlatform('https://vt.tiktok.com/ZGabc/')).toBe('tiktok');
  });

  it('classifies Instagram and YouTube', () => {
    expect(detectRecipePlatform('https://www.instagram.com/reel/Cabc/')).toBe('instagram');
    expect(detectRecipePlatform('https://youtu.be/abc123')).toBe('youtube');
    expect(detectRecipePlatform('https://www.youtube.com/shorts/abc123')).toBe('youtube');
  });

  it('falls back to web for unknown hosts and invalid input', () => {
    expect(detectRecipePlatform('https://marmiton.org/recettes/123')).toBe('web');
    expect(detectRecipePlatform('not a url')).toBe('web');
  });

  it('does not misclassify a lookalike host', () => {
    expect(detectRecipePlatform('https://nottiktok.com/video')).toBe('web');
    expect(detectRecipePlatform('https://tiktok.com.evil.com/video')).toBe('web');
  });
});

describe('normalizeRecipeUrl', () => {
  it('returns the URL and platform from shared text', () => {
    expect(normalizeRecipeUrl('  Miam https://vm.tiktok.com/ZGabc/  ')).toEqual({
      url: 'https://vm.tiktok.com/ZGabc/',
      platform: 'tiktok',
    });
  });

  it('accepts a bare URL with no surrounding text', () => {
    expect(normalizeRecipeUrl('https://www.instagram.com/reel/Cabc/')).toEqual({
      url: 'https://www.instagram.com/reel/Cabc/',
      platform: 'instagram',
    });
  });

  it('rejects empty input, plain text, and non-http schemes', () => {
    expect(normalizeRecipeUrl('')).toBeNull();
    expect(normalizeRecipeUrl('pas de lien ici')).toBeNull();
    expect(normalizeRecipeUrl('ftp://example.com/file')).toBeNull();
    expect(normalizeRecipeUrl('macrolens://import')).toBeNull();
  });
});

describe('recipePlatformLabel', () => {
  it('maps platforms to display labels', () => {
    expect(recipePlatformLabel('tiktok')).toBe('TikTok');
    expect(recipePlatformLabel('web')).toBe('Web');
  });
});
