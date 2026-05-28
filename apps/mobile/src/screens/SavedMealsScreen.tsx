import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Plus, Star, Utensils } from 'lucide-react-native';
import { buildRecurringMealSuggestions } from '../domain/recurringMeals';
import type { Meal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onBack: () => void;
  onRelogMeal: (meal: Meal) => void;
  onOpenMeal: (meal: Meal) => void;
};

function SavedMealRow({ meal, count, onRelogMeal, onOpenMeal }: { meal: Meal; count: number; onRelogMeal: (meal: Meal) => void; onOpenMeal: (meal: Meal) => void }) {
  const isImage = !meal.imageUri.startsWith('manual://') && !meal.imageUri.startsWith('product://') && !meal.imageUri.startsWith('barcode://');

  return (
    <Pressable onPress={() => onOpenMeal(meal)} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
      {isImage ? (
        <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, height: 62, width: 62 }} />
      ) : (
        <View style={{ alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, height: 62, justifyContent: 'center', width: 62 }}>
          <Utensils color={colors.muted} size={24} strokeWidth={2.4} />
        </View>
      )}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{meal.mealName}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{meal.caloriesEstimate} kcal - {meal.proteinG}g protein</Text>
        <Text style={{ color: colors.green, fontSize: typography.tiny, fontWeight: '900' }}>{count}x logged</Text>
      </View>
      <Pressable onPress={() => onRelogMeal(meal)} style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 }}>
        <Plus color={colors.black} size={19} strokeWidth={2.8} />
      </Pressable>
    </Pressable>
  );
}

export function SavedMealsScreen({ meals, onBack, onRelogMeal, onOpenMeal }: Props) {
  const suggestions = buildRecurringMealSuggestions(meals, 20);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Back</Text>
      </Pressable>

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>MACROLENS</Text>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.md }}>Saved meals</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', textAlign: 'center' }}>Templates and favorites for one-tap relogging.</Text>
      </View>

      <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, flexDirection: 'row', padding: spacing.xs }}>
        {['Saved', 'Favorites', 'Recent'].map((tab, index) => (
          <View key={tab} style={{ alignItems: 'center', backgroundColor: index === 0 ? colors.surface : 'transparent', borderRadius: radius.pill, flex: 1, minHeight: 36, justifyContent: 'center' }}>
            <Text style={{ color: index === 0 ? colors.green : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{tab}</Text>
          </View>
        ))}
      </View>

      {suggestions.length === 0 ? (
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.xxxl }}>
          <Star color={colors.muted} size={52} strokeWidth={1.8} />
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>No favorites yet</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19, textAlign: 'center' }}>Meals you repeat will appear here for quick access.</Text>
        </View>
      ) : (
        suggestions.map((suggestion) => (
          <SavedMealRow key={suggestion.id} meal={suggestion.templateMeal} count={suggestion.count} onRelogMeal={onRelogMeal} onOpenMeal={onOpenMeal} />
        ))
      )}
    </ScrollView>
  );
}
