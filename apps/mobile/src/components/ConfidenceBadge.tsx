import { Text, View } from 'react-native';
import type { ConfidenceTier } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';
import { formatConfidenceLabel } from '../ui/dashboardViewModel';

type Props = {
  confidence: ConfidenceTier;
};

export function ConfidenceBadge({ confidence }: Props) {
  const accent = confidence === 'high' ? colors.green : confidence === 'medium' ? colors.amber : colors.red;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderColor: accent,
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Text style={{ color: accent, fontSize: typography.small, fontWeight: '700' }}>
        {formatConfidenceLabel(confidence)}
      </Text>
    </View>
  );
}
