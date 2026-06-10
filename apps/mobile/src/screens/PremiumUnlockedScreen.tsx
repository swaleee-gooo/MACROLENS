import { Text, View } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import type { UnlockedEyebrow } from '../ui/paywallViewModel';
import { Card, Eyebrow, PrimaryButton, Seal } from '../ui/primitives';
import { colors, fonts, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    trialEyebrow: (days: number) => `${days}-day trial · active`,
    proEyebrow: 'MacroLens Pro · active',
    title: 'Welcome to Pro',
    trialSubtitle: 'Your free trial is on. Here is everything you unlocked.',
    proSubtitle: 'Here is everything you unlocked.',
    features: ['Unlimited scans', 'Trust levels and ranges', 'Calibration and weighed recipes', 'Multi-device sync'],
    continue: 'Continue',
  },
  fr: {
    trialEyebrow: (days: number) => `Essai ${days} jours · actif`,
    proEyebrow: 'MacroLens Pro · actif',
    title: 'Bienvenue dans Pro',
    trialSubtitle: 'Ton essai gratuit est lancé. Voici tout ce qui est débloqué.',
    proSubtitle: 'Voici tout ce qui est débloqué.',
    features: ['Scans illimités', 'Niveaux de confiance et marges', 'Calibration et recettes pesées', 'Synchro multi-appareils'],
    continue: 'Continuer',
  },
};

type Props = {
  unlocked: UnlockedEyebrow;
  onContinue: () => void;
};

export function PremiumUnlockedScreen({ unlocked, onContinue }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isTrial = unlocked.variant === 'trial';

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, padding: spacing.xl }}>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        {/* Dark rounded square + seal — the brand mark */}
        <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: 24, height: 84, justifyContent: 'center', width: 84 }}>
          <Seal size={44} color={colors.paper} />
        </View>
        <Eyebrow style={{ marginTop: 22 }}>{isTrial ? t.trialEyebrow(unlocked.trialDays) : t.proEyebrow}</Eyebrow>
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.display,
            fontSize: 25,
            fontWeight: '600',
            letterSpacing: -0.5,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          {t.title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19, marginTop: 10, maxWidth: 240, textAlign: 'center' }}>
          {isTrial ? t.trialSubtitle : t.proSubtitle}
        </Text>

        {/* Unlocked features */}
        <Card style={{ marginTop: 22, paddingHorizontal: spacing.lg, paddingVertical: 6, width: '100%' }}>
          {t.features.map((feature, index) => (
            <View key={feature}>
              {index > 0 ? <View style={{ backgroundColor: colors.line, height: 1 }} /> : null}
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md }}>
                <Check color={colors.accent} size={18} strokeWidth={2.4} />
                <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '500' }}>{feature}</Text>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <PrimaryButton
        label={t.continue}
        onPress={onContinue}
        icon={<ChevronRight color="#FFFFFF" size={18} strokeWidth={2.2} />}
        style={{ flexDirection: 'row-reverse', marginBottom: spacing.sm, marginTop: spacing.xl }}
      />
    </View>
  );
}
