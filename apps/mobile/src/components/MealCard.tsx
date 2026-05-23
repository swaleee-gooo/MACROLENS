import { Image, Pressable, Text, View } from 'react-native';
import type { Meal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';
import { ConfidenceBadge } from './ConfidenceBadge';

type Props = {
  meal: Meal;
  onPress: (meal: Meal) => void;
};

export function MealCard({ meal, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(meal)}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <Image
        source={{ uri: meal.imageUri }}
        style={{
          backgroundColor: colors.line,
          borderRadius: radius.sm,
          height: 76,
          width: 76,
        }}
      />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>
          {meal.mealName}
        </Text>
        <Text style={{ color: colors.muted, fontSize: typography.small }}>
          {meal.caloriesEstimate} kcal - {meal.proteinG} g proteines
        </Text>
        <ConfidenceBadge confidence={meal.confidence} />
      </View>
    </Pressable>
  );
}
