export type ErrorBoundaryState = {
  hasError: boolean;
};

export function resetErrorBoundaryState(): ErrorBoundaryState {
  return { hasError: false };
}

export function deriveErrorBoundaryState(): ErrorBoundaryState {
  return { hasError: true };
}

/**
 * Builds the `componentDidCatch` reporter. Reporting failures are swallowed so a
 * broken capture pipeline can never crash the fallback UI itself.
 */
export function createErrorBoundaryCatchHandler(capture: (error: unknown) => void): (error: unknown) => void {
  return (error) => {
    try {
      capture(error);
    } catch {
      // Never let error reporting take down the error screen.
    }
  };
}
