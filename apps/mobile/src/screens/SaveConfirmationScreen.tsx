import { Pressable, Text, View } from 'react-native';
import { Check, Flame, Home, ListChecks } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  streakDays: number;
  onHome: () => void;
  onTimeline: () => void;
};

export function SaveConfirmationScreen({ meal, streakDays, onHome, onTimeline }: Props) {
  const isProduct = meal.source === 'open_food_facts' || meal.source === 'nutrition_label_ocr';

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.green, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 4, height: 96, justifyContent: 'center', width: 96 }}>
          <Check color="white" size={48} strokeWidth={2.8} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>{isProduct ? 'Produit enregistre' : 'Repas enregistre'}</Text>
          <Text numberOfLines={2} style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 22, textAlign: 'center' }}>
            {meal.mealName} est ajoute a ta timeline.
          </Text>
        </View>
        {streakDays > 0 ? (
          <View style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Flame color={colors.black} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>+1 jour de streak</Text>
          </View>
        ) : null}
        <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', width: '100%' }}>
          <View style={{ flex: 1, gap: spacing.xs, padding: spacing.xl }}>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Calories</Text>
            <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>+{meal.caloriesEstimate} <Text style={{ color: colors.muted, fontSize: typography.body }}>kcal</Text></Text>
          </View>
          <View style={{ backgroundColor: colors.line, width: 1 }} />
          <View style={{ alignItems: 'flex-end', flex: 1, gap: spacing.xs, padding: spacing.xl }}>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Proteines</Text>
            <Text style={{ color: colors.green, fontSize: typography.title, fontWeight: '900' }}>+{meal.proteinG} <Text style={{ color: colors.muted, fontSize: typography.body }}>g</Text></Text>
          </View>
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        <Pressable onPress={onHome} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 60 }}>
          <Home color="white" size={19} strokeWidth={2.6} />
          <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>Retourner a l'accueil</Text>
        </Pressable>
        <Pressable onPress={onTimeline} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
          <ListChecks color={colors.black} size={18} strokeWidth={2.5} />
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Voir la timeline</Text>
        </Pressable>
      </View>
    </View>
  );
}
