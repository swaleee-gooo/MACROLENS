import { Text, View } from 'react-native';
import type { ConfidenceTier } from '../domain/types';
import { useLang } from '../i18n/LanguageContext';
import { colors, radius, spacing, typography } from '../ui/theme';
import { formatConfidenceLabel } from '../ui/dashboardViewModel';

type Props = {
  confidence: ConfidenceTier;
};

const STR = {
  en: { high: 'High confidence', medium: 'Medium confidence', low: 'Needs review' },
  fr: { high: 'Fiable', medium: 'Estimation fiable', low: 'À vérifier' },
};

export function ConfidenceBadge({ confidence }: Props) {
  const { lang } = useLang();
  const accent = confidence === 'high' ? colors.green : confidence === 'medium' ? colors.amber : colors.red;
  const label = lang === 'fr' ? STR.fr[confidence] : formatConfidenceLabel(confidence);

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
        {label}
      </Text>
    </View>
  );
}
