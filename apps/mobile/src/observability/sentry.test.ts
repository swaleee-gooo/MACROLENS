import { describe, expect, it } from 'vitest';
import { captureException, initSentry, isSentryEnabled, stripPrivateEventData } from './sentry';

describe('stripPrivateEventData', () => {
  it('strips image URL keys from event extra', () => {
    const event = {
      extra: {
        imageUri: 'file:///meals/photo.jpg',
        imageUrl: 'https://cdn.example.com/photo.jpg',
        photoUrl: 'https://cdn.example.com/photo-2.jpg',
        mealId: 'meal-1',
      },
    };

    expect(stripPrivateEventData(event).extra).toEqual({ mealId: 'meal-1' });
  });

  it('strips private keys nested inside contexts', () => {
    const event = {
      contexts: {
        scan: { imageUri: 'file:///meals/photo.jpg', mode: 'meal' },
        device: { model: 'iPhone' },
      },
    };

    expect(stripPrivateEventData(event).contexts).toEqual({
      scan: { mode: 'meal' },
      device: { model: 'iPhone' },
    });
  });

  it('strips private keys from breadcrumb data', () => {
    const event = {
      breadcrumbs: [
        { data: { photoUrl: 'https://cdn.example.com/photo.jpg', screen: 'result' } },
        { data: undefined },
      ],
    };

    expect(stripPrivateEventData(event).breadcrumbs).toEqual([{ data: { screen: 'result' } }, { data: undefined }]);
  });

  it('keeps unrelated event fields and does not mutate the input', () => {
    const event = {
      extra: { imageUri: 'file:///meals/photo.jpg', confidence: 0.8 },
      breadcrumbs: [{ data: { step: 1 } }],
    };

    const scrubbed = stripPrivateEventData(event);

    expect(scrubbed.extra).toEqual({ confidence: 0.8 });
    expect(scrubbed.breadcrumbs).toEqual([{ data: { step: 1 } }]);
    expect(event.extra).toEqual({ imageUri: 'file:///meals/photo.jpg', confidence: 0.8 });
  });
});

describe('sentry without a configured DSN', () => {
  it('reports Sentry as disabled', () => {
    expect(isSentryEnabled()).toBe(false);
  });

  it('initSentry never loads the SDK', () => {
    expect(() => initSentry()).not.toThrow();
  });

  it('captureException is a safe no-op', () => {
    expect(() => captureException(new Error('boot failed'))).not.toThrow();
  });
});
