import { Pressable, ScrollView, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import { MealCard } from '../components/MealCard';
import { colors, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onBack: () => void;
  onOpenMeal: (meal: Meal) => void;
};

export function TimelineScreen({ meals, onBack, onOpenMeal }: Props) {
  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>
      <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Timeline</Text>
      {meals.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: typography.body }}>Aucun repas enregistre.</Text>
      ) : (
        meals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
      )}
    </ScrollView>
  );
}
