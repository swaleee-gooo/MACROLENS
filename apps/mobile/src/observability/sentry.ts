import type { ComponentType } from 'react';
import { appEnv } from '../config/env';

type SentryModule = typeof import('@sentry/react-native');

// Same privacy policy as analyticsClient: meal photo URLs must never leave the
// device, so any value stored under these keys is stripped before an event is sent.
const privateEventKeys = new Set(['imageUri', 'imageUrl', 'photoUrl']);

type SentryEventLike = {
  extra?: Record<string, unknown>;
  contexts?: Record<string, Record<string, unknown> | undefined>;
  breadcrumbs?: { data?: Record<string, unknown> }[];
};

let sentry: SentryModule | null = null;

function scrubValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }

  if (value !== null && typeof value === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (privateEventKeys.has(key)) {
        continue;
      }
      scrubbed[key] = scrubValue(nested);
    }
    return scrubbed;
  }

  return value;
}

function scrubRecord<T extends Record<string, unknown>>(record: T): T {
  return scrubValue(record) as T;
}

/**
 * `beforeSend`/`beforeBreadcrumb` privacy filter, exported as a pure function so it
 * stays unit-testable without loading the native Sentry SDK.
 */
export function stripPrivateEventData<TEvent extends SentryEventLike>(event: TEvent): TEvent {
  const scrubbed: SentryEventLike = { ...event };

  if (scrubbed.extra) {
    scrubbed.extra = scrubRecord(scrubbed.extra);
  }

  if (scrubbed.contexts) {
    scrubbed.contexts = scrubRecord(scrubbed.contexts);
  }

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map((breadcrumb) =>
      breadcrumb.data ? { ...breadcrumb, data: scrubRecord(breadcrumb.data) } : breadcrumb,
    );
  }

  return scrubbed as TEvent;
}

export function isSentryEnabled(): boolean {
  return appEnv.sentryDsn !== '';
}

function resolveEnvironment(): string {
  // app.config.js publishes the build variant (development/preview/production)
  // through expo-constants extra. Required lazily so this module stays loadable
  // in node test runs.
  const constants = (require('expo-constants') as typeof import('expo-constants')).default;
  const variant = constants.expoConfig?.extra?.appVariant;
  return typeof variant === 'string' ? variant : 'production';
}

/**
 * Initializes Sentry when `EXPO_PUBLIC_SENTRY_DSN` is configured. Without a DSN the
 * SDK is never loaded and this module has zero side effects — dev and test
 * behavior stays strictly unchanged.
 */
export function initSentry(): void {
  if (!isSentryEnabled() || sentry) {
    return;
  }

  const sentryModule = require('@sentry/react-native') as SentryModule;
  sentryModule.init({
    dsn: appEnv.sentryDsn,
    environment: resolveEnvironment(),
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    beforeSend: (event) => stripPrivateEventData(event),
  });
  sentry = sentryModule;
}

/** Reports an error to Sentry. No-op when Sentry is not initialized (no DSN). */
export function captureException(error: unknown): void {
  if (!sentry) {
    return;
  }

  sentry.captureException(error);
}

/** Wraps the root component with Sentry instrumentation; returns it untouched without a DSN. */
export function wrapRootComponent<TComponent extends ComponentType<Record<string, unknown>>>(component: TComponent): TComponent {
  if (!sentry) {
    return component;
  }

  return sentry.wrap(component) as TComponent;
}
