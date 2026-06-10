import { describe, expect, it } from 'vitest';
import { createErrorBoundaryCatchHandler, deriveErrorBoundaryState, resetErrorBoundaryState } from './errorBoundaryState';

describe('error boundary state', () => {
  it('renders the fallback after a child throw (getDerivedStateFromError)', () => {
    expect(deriveErrorBoundaryState()).toEqual({ hasError: true });
  });

  it('starts without an error and Restart resets the boundary', () => {
    expect(resetErrorBoundaryState()).toEqual({ hasError: false });
  });
});

describe('createErrorBoundaryCatchHandler', () => {
  it('calls the capture callback with the thrown error', () => {
    const captured: unknown[] = [];
    const handler = createErrorBoundaryCatchHandler((error) => {
      captured.push(error);
    });

    const error = new Error('screen exploded');
    handler(error);

    expect(captured).toEqual([error]);
  });

  it('swallows capture failures so the fallback UI survives', () => {
    const handler = createErrorBoundaryCatchHandler(() => {
      throw new Error('sentry is down');
    });

    expect(() => handler(new Error('screen exploded'))).not.toThrow();
  });
});
