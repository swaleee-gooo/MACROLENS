import { describe, expect, it, vi } from 'vitest';
import { createAppAnalyticsSink, createPostHogAnalyticsSink, DEFAULT_POSTHOG_HOST, type PostHogModule, type PostHogModuleLoader } from './posthogAnalyticsSink';

type RecordedCall = { method: 'capture' | 'identify' | 'reset'; args: unknown[] };

function createFakePostHogModule() {
  const constructorCalls: Array<{ apiKey: string; options?: Record<string, unknown> }> = [];
  const calls: RecordedCall[] = [];

  class FakePostHog {
    constructor(apiKey: string, options?: Record<string, unknown>) {
      constructorCalls.push({ apiKey, options });
    }

    capture(eventName: string, properties?: Record<string, unknown>) {
      calls.push({ method: 'capture', args: [eventName, properties] });
    }

    identify(distinctId: string) {
      calls.push({ method: 'identify', args: [distinctId] });
    }

    reset() {
      calls.push({ method: 'reset', args: [] });
    }
  }

  const module: PostHogModule = { PostHog: FakePostHog };
  return { module, constructorCalls, calls };
}

function flushAsync(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('createPostHogAnalyticsSink', () => {
  it('buffers events tracked before the client is ready, then delivers them in order', async () => {
    const fake = createFakePostHogModule();
    let resolveLoad!: (module: PostHogModule) => void;
    const loadModule: PostHogModuleLoader = () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      });

    const sink = createPostHogAnalyticsSink('phc_test_key', undefined, loadModule);
    sink.track({ name: 'app_opened', payload: {} });
    sink.track({ name: 'onboarding_started', payload: {} });

    expect(fake.calls).toEqual([]);

    resolveLoad(fake.module);
    await flushAsync();

    expect(fake.constructorCalls).toEqual([
      { apiKey: 'phc_test_key', options: { host: DEFAULT_POSTHOG_HOST, flushAt: 10, flushInterval: 30 } },
    ]);
    expect(fake.calls).toEqual([
      { method: 'capture', args: ['app_opened', {}] },
      { method: 'capture', args: ['onboarding_started', {}] },
    ]);

    sink.track({ name: 'meal_saved', payload: { source: 'photo' } });
    expect(fake.calls).toEqual([
      { method: 'capture', args: ['app_opened', {}] },
      { method: 'capture', args: ['onboarding_started', {}] },
      { method: 'capture', args: ['meal_saved', { source: 'photo' }] },
    ]);
  });

  it('forwards identify and reset to the client, preserving call order', async () => {
    const fake = createFakePostHogModule();
    const sink = createPostHogAnalyticsSink('phc_test_key', 'https://eu.i.posthog.com', async () => fake.module);

    sink.identify('00000000-0000-4000-8000-000000000001');
    sink.track({ name: 'paywall_viewed', payload: {} });
    sink.reset();
    await flushAsync();

    expect(fake.constructorCalls).toEqual([
      { apiKey: 'phc_test_key', options: { host: 'https://eu.i.posthog.com', flushAt: 10, flushInterval: 30 } },
    ]);
    expect(fake.calls).toEqual([
      { method: 'identify', args: ['00000000-0000-4000-8000-000000000001'] },
      { method: 'capture', args: ['paywall_viewed', {}] },
      { method: 'reset', args: [] },
    ]);
  });

  it('drops events without crashing when the SDK fails to load', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sink = createPostHogAnalyticsSink('phc_test_key', undefined, async () => {
      throw new Error('native module missing');
    });

    sink.track({ name: 'app_opened', payload: {} });
    await flushAsync();
    sink.track({ name: 'meal_saved', payload: {} });
    sink.identify('user-1');
    sink.reset();

    expect(warnSpy).toHaveBeenCalledWith('[analytics] posthog_sdk_unavailable', expect.any(Error));
    warnSpy.mockRestore();
  });
});

describe('createAppAnalyticsSink', () => {
  it('returns a console-only sink and never attempts the dynamic import when the key is absent', () => {
    const loadModule = vi.fn<PostHogModuleLoader>();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const sink = createAppAnalyticsSink('', loadModule);
    sink.track({ name: 'app_opened', payload: {} });
    sink.identify('local-user');
    sink.reset();

    expect(loadModule).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('[analytics]', 'app_opened', {});
    logSpy.mockRestore();
  });

  it('fans out to console and PostHog and forwards identify/reset when the key is present', async () => {
    const fake = createFakePostHogModule();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const sink = createAppAnalyticsSink('phc_test_key', async () => fake.module);
    await flushAsync();

    sink.track({ name: 'paywall_viewed', payload: {} });
    sink.identify('00000000-0000-4000-8000-000000000001');
    sink.reset();

    expect(logSpy).toHaveBeenCalledWith('[analytics]', 'paywall_viewed', {});
    expect(fake.constructorCalls).toEqual([
      { apiKey: 'phc_test_key', options: { host: DEFAULT_POSTHOG_HOST, flushAt: 10, flushInterval: 30 } },
    ]);
    expect(fake.calls).toEqual([
      { method: 'capture', args: ['paywall_viewed', {}] },
      { method: 'identify', args: ['00000000-0000-4000-8000-000000000001'] },
      { method: 'reset', args: [] },
    ]);
    logSpy.mockRestore();
  });
});
