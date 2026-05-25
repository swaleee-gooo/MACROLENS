import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Flame, Package, Utensils } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { PremiumCard } from '../components/PremiumCard';
import type { Meal } from '../domain/types';
import { buildTimelineSections } from '../ui/timelineSectionsViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onOpenMeal: (meal: Meal) => void;
};

function confidenceLabel(confidence: Meal['confidence']): { label: string; background: string; color: string } {
  if (confidence === 'high') {
    return { label: 'ELEVEE', background: colors.greenSoft, color: colors.green };
  }
  if (confidence === 'medium') {
    return { label: 'MOYENNE', background: colors.amberSoft, color: colors.black };
  }
  return { label: 'FAIBLE', background: colors.redSoft, color: colors.red };
}

function TimelineMealCard({ meal, onOpenMeal }: { meal: Meal; onOpenMeal: (meal: Meal) => void }) {
  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const badge = confidenceLabel(meal.confidence);

  return (
    <Pressable onPress={() => onOpenMeal(meal)}>
      <PremiumCard style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        {isManual || isProduct ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 74, justifyContent: 'center', width: 74 }}>
            {isProduct ? <Package color={colors.green} size={28} strokeWidth={2.4} /> : <Utensils color={colors.muted} size={28} strokeWidth={2.4} />}
          </View>
        ) : (
          <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 74, width: 74 }} />
        )}
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{meal.mealName}</Text>
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>
            <Flame color={colors.black} size={16} strokeWidth={2.4} /> {meal.caloriesEstimate} kcal  <Text style={{ color: colors.green }}>{meal.proteinG}g Prot</Text>
          </Text>
        </View>
        <View style={{ backgroundColor: badge.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
          <Text style={{ color: badge.color, fontSize: typography.tiny, fontWeight: '900' }}>{badge.label}</Text>
        </View>
      </PremiumCard>
    </Pressable>
  );
}

export function PremiumTimelineScreen({ meals, onOpenMeal }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const sections = buildTimelineSections(meals, today);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader />
      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>Timeline</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>Votre historique nutritionnel detaille.</Text>
      </View>
      <View style={{ gap: spacing.xl, paddingHorizontal: spacing.xl }}>
        {sections.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>Aucun repas enregistre.</Text>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={{ gap: spacing.md }}>
              <Text style={{ borderBottomColor: colors.line, borderBottomWidth: 1, color: colors.black, fontSize: typography.title, fontWeight: '900', paddingBottom: spacing.sm }}>{section.title}</Text>
              {section.meals.map((meal) => (
                <TimelineMealCard key={meal.id} meal={meal} onOpenMeal={onOpenMeal} />
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
