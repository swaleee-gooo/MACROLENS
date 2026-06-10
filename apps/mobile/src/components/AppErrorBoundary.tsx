import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { captureException } from '../observability/sentry';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';
import {
  createErrorBoundaryCatchHandler,
  deriveErrorBoundaryState,
  resetErrorBoundaryState,
  type ErrorBoundaryState,
} from './errorBoundaryState';

type Props = {
  children: ReactNode;
  /** Injectable error reporter (defaults to the observability module — no-op without a DSN). */
  onError?: (error: unknown) => void;
};

export class AppErrorBoundary extends Component<Props, ErrorBoundaryState> {
  state: ErrorBoundaryState = resetErrorBoundaryState();

  static getDerivedStateFromError(): ErrorBoundaryState {
    return deriveErrorBoundaryState();
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    const report = createErrorBoundaryCatchHandler(this.props.onError ?? captureException);
    report(error);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.heading, textAlign: 'center' }}>
          Something went wrong
        </Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, marginTop: spacing.md, textAlign: 'center' }}>
          The error has been logged. Restart to keep tracking your meals.
        </Text>
        <Pressable
          accessibilityLabel="Restart"
          onPress={() => this.setState(resetErrorBoundaryState())}
          style={{
            alignItems: 'center',
            backgroundColor: colors.ink,
            borderRadius: radius.pill,
            marginTop: spacing.xl,
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ color: colors.surface, fontFamily: fonts.mono, fontSize: typography.body, fontWeight: '600' }}>Restart</Text>
        </Pressable>
      </View>
    );
  }
}
