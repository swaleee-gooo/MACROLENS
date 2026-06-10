import { describe, expect, it } from 'vitest';
import { createAnalyticsClient, createFanoutAnalyticsSink, createMemoryAnalyticsSink } from './analyticsClient';

describe('analytics client', () => {
  it('records typed commercial events without private image data', () => {
    const sink = createMemoryAnalyticsSink();
    const analytics = createAnalyticsClient(sink);

    analytics.track('scan_completed', {
      source: 'photo',
      confidence: 'low',
      caloriesEstimate: 789,
      corrected: false,
    });

    expect(sink.events).toEqual([
      {
        name: 'scan_completed',
        payload: {
          source: 'photo',
          confidence: 'low',
          caloriesEstimate: 789,
          corrected: false,
        },
      },
    ]);
  });

  it('rejects image URLs and raw text notes from analytics payloads', () => {
    const sink = createMemoryAnalyticsSink();
    const analytics = createAnalyticsClient(sink);

    expect(() =>
      analytics.track('scan_started', {
        source: 'photo',
        imageUri: 'file:///private/photo.jpg',
      }),
    ).toThrow('analytics_private_payload_imageUri');

    expect(() =>
      analytics.track('meal_saved', {
        source: 'photo',
        rawNote: 'full private user note',
      }),
    ).toThrow('analytics_private_payload_rawNote');
  });

  it('fans out every event to all sinks with the event name unchanged', () => {
    const first = createMemoryAnalyticsSink();
    const second = createMemoryAnalyticsSink();
    const analytics = createAnalyticsClient(createFanoutAnalyticsSink(first, second));

    analytics.track('app_opened');
    analytics.track('paywall_cta_tapped', { plan: 'annual' });

    const expected = [
      { name: 'app_opened', payload: {} },
      { name: 'paywall_cta_tapped', payload: { plan: 'annual' } },
    ];
    expect(first.events).toEqual(expected);
    expect(second.events).toEqual(expected);
  });
});
