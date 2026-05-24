import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react-native';
import { PremiumCard } from '../components/PremiumCard';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { adjustMealItemGrams, portionGramPresets } from '../domain/portionAdjustments';
import type { Meal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  itemId: string;
  onBack: () => void;
  onApply: (meal: Meal) => void;
};

export function PortionAdjustScreen({ meal, itemId, onBack, onApply }: Props) {
  const item = meal.items.find((candidate) => candidate.id === itemId) ?? meal.items[0];
  const initialGrams = item?.unit === 'g' ? item.estimatedQuantity : 150;
  const [grams, setGrams] = useState(Math.max(25, Math.round(initialGrams || 150)));
  const adjustedMeal = useMemo(() => (item ? adjustMealItemGrams(meal, item.id, grams) : meal), [grams, item, meal]);

  if (!item) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Aucun aliment ajustable.</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ flex: 1, gap: spacing.xl, padding: spacing.xl }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <ArrowLeft color={colors.black} size={28} strokeWidth={2.6} />
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>MACROLENS</Text>
        </Pressable>

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>CORRECTION</Text>
            </View>
            <View style={{ backgroundColor: colors.greenSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>HAUTE CONFIANCE</Text>
            </View>
          </View>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>{item.name}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.subheading, fontWeight: '800', lineHeight: 27 }}>Ajustez la quantite pour affiner l'estimation nutritionnelle.</Text>
        </View>

        <PremiumCard style={{ alignItems: 'center', gap: spacing.xl, paddingVertical: spacing.xl }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Poids estime</Text>
          <Text style={{ color: colors.black, fontSize: 58, fontWeight: '900' }}>{grams}<Text style={{ color: colors.muted, fontSize: typography.heading }}> g</Text></Text>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Pressable onPress={() => setGrams(Math.max(25, grams - 25))} style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 2, height: 64, justifyContent: 'center', width: 64 }}>
              <Minus color={colors.black} size={28} strokeWidth={2.6} />
            </Pressable>
            <Pressable onPress={() => setGrams(grams + 25)} style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 2, height: 64, justifyContent: 'center', width: 64 }}>
              <Plus color={colors.black} size={28} strokeWidth={2.6} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
            {portionGramPresets.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setGrams(preset)}
                style={{
                  backgroundColor: grams === preset ? colors.surfaceMuted : colors.surface,
                  borderColor: colors.line,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{preset}g</Text>
              </Pressable>
            ))}
          </View>
        </PremiumCard>

        <View style={{ gap: spacing.md }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Impact nutritionnel</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <PremiumCard style={{ flex: 1 }}>
              <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>CALORIES</Text>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>{adjustedMeal.caloriesLow}-{adjustedMeal.caloriesHigh}</Text>
            </PremiumCard>
            <PremiumCard style={{ flex: 1 }}>
              <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>PROTEINES</Text>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>{adjustedMeal.proteinG} g</Text>
            </PremiumCard>
          </View>
        </View>
      </View>
      <StickyFooterButton label="Valider l'ajustement" onPress={() => onApply(adjustedMeal)} icon={<Check color="white" size={24} strokeWidth={2.8} />} />
    </View>
  );
}
