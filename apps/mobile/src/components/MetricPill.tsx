import { Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  label: string;
  value: string;
  accent?: string;
};

export function MetricPill({ label, value, accent = colors.ink }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.sm,
        borderWidth: 1,
        minWidth: 94,
        padding: spacing.md,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '700', textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ color: accent, fontSize: typography.body, fontWeight: '800', marginTop: spacing.xs }}>
        {value}
      </Text>
    </View>
  );
}
