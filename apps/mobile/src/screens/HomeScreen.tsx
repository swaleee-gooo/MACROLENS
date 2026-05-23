import { Pressable, ScrollView, Text, View } from 'react-native';
import { Camera, ImagePlus, PenLine } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import { MealCard } from '../components/MealCard';
import { MetricPill } from '../components/MetricPill';
import { colors, radius, spacing, typography } from '../ui/theme';
import { buildDailySummary } from '../ui/dashboardViewModel';

type Props = {
  meals: Meal[];
  onCapture: () => void;
  onPickPhoto: () => void;
  onQuickAdd: () => void;
  onOpenTimeline: () => void;
  onOpenMeal: (meal: Meal) => void;
};

export function HomeScreen({ meals, onCapture, onPickPhoto, onQuickAdd, onOpenTimeline, onOpenMeal }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const summary = buildDailySummary(meals, today);
  const recentMeals = meals.slice(0, 3);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>MacroLens</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>Photo, macros, confiance.</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <MetricPill label="Calories" value={`${summary.calories}`} />
        <MetricPill label="Proteines" value={`${summary.proteinG} g`} accent={colors.protein} />
        <MetricPill label="Glucides" value={`${summary.carbsG} g`} accent={colors.carbs} />
        <MetricPill label="Lipides" value={`${summary.fatG} g`} accent={colors.fat} />
      </View>

      <View style={{ gap: spacing.md }}>
        <Pressable
          onPress={onCapture}
          style={{
            alignItems: 'center',
            backgroundColor: colors.green,
            borderRadius: radius.md,
            flexDirection: 'row',
            gap: spacing.sm,
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <Camera color="white" size={20} strokeWidth={2.5} />
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Scanner un repas</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable
            onPress={onPickPhoto}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.md,
              borderWidth: 1,
              flex: 1,
              flexDirection: 'row',
              gap: spacing.sm,
              justifyContent: 'center',
              padding: spacing.md,
            }}
          >
            <ImagePlus color={colors.blue} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>Galerie</Text>
          </Pressable>
          <Pressable
            onPress={onQuickAdd}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.md,
              borderWidth: 1,
              flex: 1,
              flexDirection: 'row',
              gap: spacing.sm,
              justifyContent: 'center',
              padding: spacing.md,
            }}
          >
            <PenLine color={colors.amber} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>Quick add</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Recents</Text>
          <Pressable onPress={onOpenTimeline}>
            <Text style={{ color: colors.blue, fontSize: typography.small, fontWeight: '800' }}>Voir tout</Text>
          </Pressable>
        </View>
        {recentMeals.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: typography.body }}>Ton premier scan apparaitra ici.</Text>
        ) : (
          recentMeals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
        )}
      </View>
    </ScrollView>
  );
}
