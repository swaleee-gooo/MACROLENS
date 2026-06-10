import { Pressable, Text, View } from 'react-native';
import { CameraOff, Check, RefreshCw } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, PrimaryButton } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type ScanErrorVariant = 'non_food' | 'low_light' | 'label' | 'rate_limited';

type Props = {
  variant: ScanErrorVariant;
  onRetake: () => void;
  onManual: () => void;
  onHome: () => void;
};

const STR = {
  en: {
    tipsLabel: 'Tips',
    retake: 'Retry',
    addManually: 'Manual entry',
    goHome: 'Go home',
    labelTitle: "Couldn't read label",
    labelDetail: 'The nutrition table is blurry, cropped, or incomplete.',
    labelTips: ['Frame the full label', 'Keep the phone straight', 'Show the per-100g values'],
    lowLightTitle: 'Low light detected',
    lowLightDetail: 'The photo needs more light to estimate portions with confidence.',
    lowLightTips: ['Use natural light', 'Avoid harsh shadows', 'Retake the photo from higher up'],
    nonFoodTitle: 'No meal detected',
    nonFoodDetail: 'We could not find usable food in this photo.',
    nonFoodTips: ['Frame the full plate', 'Avoid isolated objects', 'Add manually if needed'],
    rateLimitTitle: 'Hourly scan limit reached',
    rateLimitDetail: "You've hit the hourly scan limit. Try again in a few minutes.",
    rateLimitTips: ['Limits reset every hour', 'Add the meal manually meanwhile', 'Your saved meals stay available'],
  },
  fr: {
    tipsLabel: 'Conseils',
    retake: 'Réessayer',
    addManually: 'Saisie manuelle',
    goHome: 'Retour à l\'accueil',
    labelTitle: 'Impossible de lire l\'étiquette',
    labelDetail: 'Le tableau nutritionnel est flou, tronqué ou incomplet.',
    labelTips: ['Cadrez l\'étiquette entière', 'Gardez le téléphone droit', 'Montrez les valeurs pour 100g'],
    lowLightTitle: 'Faible luminosité détectée',
    lowLightDetail: 'La photo nécessite plus de lumière pour estimer les portions avec fiabilité.',
    lowLightTips: ['Utilisez la lumière naturelle', 'Évitez les ombres marquées', 'Reprenez la photo depuis plus haut'],
    nonFoodTitle: 'Aucun repas détecté',
    nonFoodDetail: 'Nous n\'avons pas trouvé d\'aliments exploitables dans cette photo.',
    nonFoodTips: ['Cadrez toute l\'assiette', 'Évitez les objets isolés', 'Ajoutez manuellement si nécessaire'],
    rateLimitTitle: 'Limite horaire atteinte',
    rateLimitDetail: 'Vous avez atteint la limite horaire de scans. Réessayez dans quelques minutes.',
    rateLimitTips: ['La limite se réinitialise chaque heure', 'Ajoutez le repas manuellement en attendant', 'Vos repas enregistrés restent disponibles'],
  },
};

export function ScanErrorScreen({ variant, onRetake, onManual, onHome }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  function contentForVariant(v: ScanErrorVariant) {
    if (v === 'label') {
      return {
        title: t.labelTitle,
        detail: t.labelDetail,
        tips: t.labelTips,
        assetVariant: 'error' as const,
      };
    }

    if (v === 'low_light') {
      return {
        title: t.lowLightTitle,
        detail: t.lowLightDetail,
        tips: t.lowLightTips,
        assetVariant: 'error' as const,
      };
    }

    if (v === 'rate_limited') {
      return {
        title: t.rateLimitTitle,
        detail: t.rateLimitDetail,
        tips: t.rateLimitTips,
        assetVariant: 'error' as const,
      };
    }

    return {
      title: t.nonFoodTitle,
      detail: t.nonFoodDetail,
      tips: t.nonFoodTips,
      assetVariant: 'empty' as const,
    };
  }

  const content = contentForVariant(variant);

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
      <View />

      {/* Center content — matches prototype: icon box, title, detail, tips card */}
      <View style={{ alignItems: 'center', gap: spacing.xl }}>
        {/* Warning icon box */}
        <View style={{ alignItems: 'center', backgroundColor: colors.warnWash, borderColor: colors.warnLine, borderRadius: 20, borderWidth: 1, height: 72, justifyContent: 'center', width: 72 }}>
          <CameraOff color={colors.warn} size={34} strokeWidth={1.75} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' }}>{content.title}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23, textAlign: 'center', maxWidth: 250 }}>{content.detail}</Text>
        </View>

        {/* Tips card — checkmark bullets matching prototype */}
        <Card style={{ alignSelf: 'stretch', padding: spacing.xs * 1.5, paddingHorizontal: spacing.md }}>
          {content.tips.map((tip, i) => (
            <View key={tip}>
              {i > 0 ? <View style={{ backgroundColor: colors.line, height: 1 }} /> : null}
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingVertical: 11 }}>
                <Check color={colors.accent} size={16} strokeWidth={2.4} />
                <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, lineHeight: 20 }}>{tip}</Text>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* Actions — retry (dark) + manual (ghost), matching prototype */}
      <View style={{ gap: spacing.md }}>
        <PrimaryButton
          label={t.retake}
          onPress={onRetake}
          variant="dark"
          icon={<RefreshCw color="#FFFFFF" size={17} strokeWidth={2} />}
        />
        <Pressable
          onPress={onManual}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.md,
            borderWidth: 1,
            flexDirection: 'row' as const,
            gap: spacing.sm,
            justifyContent: 'center',
            minHeight: 54,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.addManually}</Text>
        </Pressable>
      </View>
    </View>
  );
}
