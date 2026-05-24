import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../ui/theme';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function PremiumCard({ children, style }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        padding: spacing.lg,
        ...shadows.card,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
