import { Pressable, Text, View } from 'react-native';
import { Flame, Home, ListChecks } from 'lucide-react-native';
import { StateSignalAsset } from '../components/BrandAssets';
import { useLang } from '../i18n/LanguageContext';
import type { Meal } from '../domain/types';
import { Card, Eyebrow, Num, PrimaryButton, Seal } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  streakDays: number;
  onHome: () => void;
  onTimeline: () => void;
};

const STR = {
  en: {
    productSaved: 'Product saved',
    mealSaved: 'Meal saved',
    addedToTimeline: (name: string) => `${name} was added to your timeline.`,
    streakDay: '+1 streak day',
    calories: 'Calories',
    protein: 'Protein',
    backToHome: 'Back to Home',
    viewTimeline: 'View timeline',
  },
  fr: {
    productSaved: 'Produit enregistré',
    mealSaved: 'Repas enregistré',
    addedToTimeline: (name: string) => `${name} a été ajouté à votre chronologie.`,
    streakDay: '+1 jour de série',
    calories: 'Calories',
    protein: 'Protéines',
    backToHome: 'Retour à l\'accueil',
    viewTimeline: 'Voir la chronologie',
  },
};

export function SaveConfirmationScreen({ meal, streakDays, onHome, onTimeline }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isProduct = meal.source === 'open_food_facts' || meal.source === 'nutrition_label_ocr';

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl }}>
        <View style={{ alignItems: 'center', height: 126, justifyContent: 'center', width: 150 }}>
          <StateSignalAsset height={126} variant="success" width={150} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' }}>
            {isProduct ? t.productSaved : t.mealSaved}
          </Text>
          <Text numberOfLines={2} style={{ color: colors.muted, fontSize: typography.body, lineHeight: 22, textAlign: 'center' }}>
            {t.addedToTimeline(meal.mealName)}
          </Text>
        </View>

        {streakDays > 0 ? (
          <View style={{ alignItems: 'center', borderColor: colors.line2, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Flame color={colors.warn} size={16} strokeWidth={2} />
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.streakDay}</Text>
          </View>
        ) : null}

        <Card style={{ flexDirection: 'row', overflow: 'hidden', width: '100%' }}>
          <View style={{ flex: 1, gap: spacing.xs, padding: spacing.xl }}>
            <Eyebrow>{t.calories}</Eyebrow>
            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 5, marginTop: 4 }}>
              <Num style={{ color: colors.ink, fontSize: typography.title, fontWeight: '600', letterSpacing: -0.4 }}>+{meal.caloriesEstimate}</Num>
              <Num style={{ color: colors.muted, fontSize: typography.body, marginBottom: 2 }}>kcal</Num>
            </View>
          </View>
          <View style={{ backgroundColor: colors.line, width: 1 }} />
          <View style={{ alignItems: 'flex-end', flex: 1, gap: spacing.xs, padding: spacing.xl }}>
            <Eyebrow>{t.protein}</Eyebrow>
            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 5, marginTop: 4 }}>
              <Num style={{ color: colors.ink, fontSize: typography.title, fontWeight: '600', letterSpacing: -0.4 }}>+{meal.proteinG}</Num>
              <Num style={{ color: colors.muted, fontSize: typography.body, marginBottom: 2 }}>g</Num>
            </View>
          </View>
        </Card>
      </View>

      <View style={{ gap: spacing.md }}>
        <PrimaryButton
          label={t.backToHome}
          onPress={onHome}
          variant="dark"
          icon={<Home color="#FFFFFF" size={18} strokeWidth={2.2} />}
        />
        <PrimaryButton
          label={t.viewTimeline}
          onPress={onTimeline}
          variant="ghost"
          icon={<ListChecks color={colors.ink} size={17} strokeWidth={2.2} />}
        />
      </View>
    </View>
  );
}
