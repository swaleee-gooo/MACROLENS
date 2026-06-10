import { createConsoleAnalyticsSink, createFanoutAnalyticsSink, type AnalyticsSink } from './analyticsClient';

export const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

type PostHogClientLike = {
  capture(eventName: string, properties?: Record<string, unknown>): unknown;
  identify(distinctId: string): unknown;
  reset(): unknown;
};

export type PostHogModule = {
  PostHog: new (
    apiKey: string,
    options?: { host?: string; flushAt?: number; flushInterval?: number },
  ) => PostHogClientLike;
};

export type PostHogModuleLoader = () => Promise<PostHogModule>;

// The SDK is loaded with a dynamic import on purpose (same pattern as
// loadPurchases() in revenueCatEntitlementProvider.ts): there must be no
// top-level import of 'posthog-react-native' anywhere, so the SDK is never
// executed when no API key is configured (local dev, CI, tests).
const loadPostHogModule: PostHogModuleLoader = async () => {
  const module = await import('posthog-react-native');
  return module as unknown as PostHogModule;
};

export type PostHogAnalyticsSink = AnalyticsSink & {
  identify(distinctId: string): void;
  reset(): void;
};

// AnalyticsSink.track is synchronous while the SDK import is asynchronous, so
// this sink buffers every operation (track / identify / reset, in call order)
// until the PostHog client is ready, then replays the buffer. Once ready,
// operations are forwarded directly. If the SDK fails to load, buffered
// operations are dropped and the sink becomes a no-op: analytics must never
// crash the app.
export function createPostHogAnalyticsSink(
  apiKey: string,
  host: string = DEFAULT_POSTHOG_HOST,
  loadModule: PostHogModuleLoader = loadPostHogModule,
): PostHogAnalyticsSink {
  let client: PostHogClientLike | null = null;
  let loadFailed = false;
  const pendingOperations: Array<(readyClient: PostHogClientLike) => void> = [];

  loadModule()
    .then((module) => {
      const readyClient = new module.PostHog(apiKey, { host, flushAt: 10, flushInterval: 30 });
      client = readyClient;
      for (const operation of pendingOperations) {
        operation(readyClient);
      }
      pendingOperations.length = 0;
    })
    .catch((error) => {
      loadFailed = true;
      pendingOperations.length = 0;
      console.warn('[analytics] posthog_sdk_unavailable', error);
    });

  function run(operation: (readyClient: PostHogClientLike) => void): void {
    if (client) {
      operation(client);
      return;
    }
    if (!loadFailed) {
      pendingOperations.push(operation);
    }
  }

  return {
    track(event) {
      run((readyClient) => readyClient.capture(event.name, event.payload));
    },
    identify(distinctId) {
      run((readyClient) => readyClient.identify(distinctId));
    },
    reset() {
      run((readyClient) => readyClient.reset());
    },
  };
}

export type AppAnalyticsSink = AnalyticsSink & {
  identify(distinctId: string): void;
  reset(): void;
};

// Sink factory used by App.tsx: console sink always; when a PostHog API key is
// configured, events fan out to console + PostHog. Without a key the PostHog
// SDK is never imported and identify/reset are no-ops.
export function createAppAnalyticsSink(
  posthogApiKey: string,
  loadModule: PostHogModuleLoader = loadPostHogModule,
): AppAnalyticsSink {
  const consoleSink = createConsoleAnalyticsSink();

  if (!posthogApiKey) {
    return {
      track(event) {
        consoleSink.track(event);
      },
      identify() {},
      reset() {},
    };
  }

  const posthogSink = createPostHogAnalyticsSink(posthogApiKey, DEFAULT_POSTHOG_HOST, loadModule);
  const fanoutSink = createFanoutAnalyticsSink(consoleSink, posthogSink);

  return {
    track(event) {
      fanoutSink.track(event);
    },
    identify(distinctId) {
      posthogSink.identify(distinctId);
    },
    reset() {
      posthogSink.reset();
    },
  };
}
