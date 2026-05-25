import type { AnalyticsEventName, AnalyticsPayload } from './analyticsEvents';

const privatePayloadKeys = new Set(['imageUri', 'imageUrl', 'photoUrl', 'rawNote', 'freeText']);

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
};

export type AnalyticsSink = {
  track(event: AnalyticsEvent): void;
};

export type AnalyticsClient = {
  track(name: AnalyticsEventName, payload?: AnalyticsPayload): void;
};

export function assertPrivacySafePayload(payload: AnalyticsPayload): void {
  for (const key of Object.keys(payload)) {
    if (privatePayloadKeys.has(key)) {
      throw new Error(`analytics_private_payload_${key}`);
    }
  }
}

export function createMemoryAnalyticsSink(): AnalyticsSink & { events: AnalyticsEvent[] } {
  return {
    events: [],
    track(event) {
      this.events.push(event);
    },
  };
}

export function createConsoleAnalyticsSink(): AnalyticsSink {
  return {
    track(event) {
      console.log('[analytics]', event.name, event.payload);
    },
  };
}

export function createAnalyticsClient(sink: AnalyticsSink): AnalyticsClient {
  return {
    track(name, payload = {}) {
      assertPrivacySafePayload(payload);
      sink.track({ name, payload });
    },
  };
}
