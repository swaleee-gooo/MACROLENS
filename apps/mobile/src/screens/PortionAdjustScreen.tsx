import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Check, Minus, Plus, UtensilsCrossed } from 'lucide-react-native';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { adjustMealItemGrams, portionGramPresets } from '../domain/portionAdjustments';
import type { Meal } from '../domain/types';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, MacroBar, Num, ProofChip } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  itemId: string;
  onBack: () => void;
  onApply: (meal: Meal) => void;
};

const STR = {
  en: {
    title: 'Adjust',
    correctionLabel: 'Correction',
    highConfidenceLabel: 'High confidence',
    description: 'Adjust the quantity to refine the nutrition estimate.',
    estimatedQuantity: 'Estimated quantity',
    slideHint: 'Slide to adjust — the margin recalculates',
    recalculatedEnergy: 'Recalculated energy',
    nutritionImpact: 'Nutrition impact',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    applyAdjustment: 'Confirm',
    noAdjustableFood: 'No adjustable food.',
  },
  fr: {
    title: 'Ajuster',
    correctionLabel: 'Correction',
    highConfidenceLabel: 'Haute fiabilité',
    description: 'Ajustez la quantité pour affiner l\'estimation nutritionnelle.',
    estimatedQuantity: 'Quantité estimée',
    slideHint: 'Glisse pour affiner — la marge se recalcule',
    recalculatedEnergy: 'Énergie recalculée',
    nutritionImpact: 'Impact nutritionnel',
    calories: 'Calories',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    applyAdjustment: 'Valider',
    noAdjustableFood: 'Aucun aliment ajustable.',
  },
};

export function PortionAdjustScreen({ meal, itemId, onBack, onApply }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const item = meal.items.find((candidate) => candidate.id === itemId) ?? meal.items[0];
  const initialGrams = item?.unit === 'g' ? item.estimatedQuantity : 150;
  const [grams, setGrams] = useState(Math.max(25, Math.round(initialGrams || 150)));
  const adjustedMeal = useMemo(() => (item ? adjustMealItemGrams(meal, item.id, grams) : meal), [grams, item, meal]);

  if (!item) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '800' }}>{t.noAdjustableFood}</Text>
      </View>
    );
  }

  const proteinKcal = adjustedMeal.proteinG * 4;
  const carbsKcal = adjustedMeal.carbsG * 4;
  const fatKcal = adjustedMeal.fatG * 9;
  const macroTotal = proteinKcal + carbsKcal + fatKcal || 1;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
        {/* Push header: back + title + OK */}
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => ({
              alignItems: 'center',
              height: 30,
              justifyContent: 'center',
              marginLeft: -6,
              opacity: pressed ? 0.7 : 1,
              width: 30,
            })}
          >
            <ArrowLeft color={colors.ink2} size={20} strokeWidth={2} />
          </Pressable>
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600', letterSpacing: -0.1 }}>{t.title}</Text>
          <Pressable onPress={() => onApply(adjustedMeal)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600' }}>OK</Text>
          </Pressable>
        </View>

        {/* Food tile + item name — matches prototype */}
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.proteinWash, borderRadius: 12, height: 48, justifyContent: 'center', width: 48 }}>
            <UtensilsCrossed color={colors.protein} size={24} strokeWidth={1.75} />
          </View>
          <View>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
            <Num style={{ color: colors.muted, fontSize: typography.tiny, marginTop: 3 }}>{item.unit === 'g' ? `${item.estimatedQuantity} g` : item.unit}</Num>
          </View>
        </View>

        {/* Estimated quantity eyebrow */}
        <Eyebrow>{t.estimatedQuantity}</Eyebrow>

        {/* Stepper row — matches prototype */}
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 6 }}>
          <Pressable
            onPress={() => setGrams(Math.max(25, grams - 25))}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: colors.paper2,
              borderRadius: 9,
              height: 38,
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              width: 38,
            })}
          >
            <Minus color={colors.ink} size={18} strokeWidth={2} />
          </Pressable>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4 }}>
            <Num style={{ fontSize: 20, fontWeight: '600' }}>{grams}</Num>
            <Num style={{ color: colors.muted, fontSize: typography.small, fontWeight: '400' }}>g</Num>
          </View>
          <Pressable
            onPress={() => setGrams(grams + 25)}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: colors.paper2,
              borderRadius: 9,
              height: 38,
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              width: 38,
            })}
          >
            <Plus color={colors.ink} size={18} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Hint text */}
        <Eyebrow color={colors.muted2} style={{ marginTop: -spacing.md }}>{t.slideHint}</Eyebrow>

        {/* Nutrition card with macro bar + legend — matches prototype */}
        <Card style={{ padding: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Eyebrow>{t.recalculatedEnergy}</Eyebrow>
          </View>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm, marginBottom: 14 }}>
            <Num style={{ fontSize: 32, fontWeight: '500' }}>{adjustedMeal.caloriesEstimate}</Num>
            <Num style={{ color: colors.muted, fontSize: typography.small }}>kcal</Num>
          </View>
          <MacroBar
            segments={[
              { pct: (proteinKcal / macroTotal) * 100, color: colors.protein },
              { pct: (carbsKcal / macroTotal) * 100, color: colors.carbs },
              { pct: (fatKcal / macroTotal) * 100, color: colors.fat },
            ]}
          />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 11 }}>
            <View style={{ flex: 1 }}>
              <Eyebrow>{t.protein}</Eyebrow>
              <Num style={{ fontSize: 14, fontWeight: '600', marginTop: 3 }}>{adjustedMeal.proteinG}g</Num>
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow>{t.carbs}</Eyebrow>
              <Num style={{ fontSize: 14, fontWeight: '600', marginTop: 3 }}>{adjustedMeal.carbsG}g</Num>
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow>{t.fat}</Eyebrow>
              <Num style={{ fontSize: 14, fontWeight: '600', marginTop: 3 }}>{adjustedMeal.fatG}g</Num>
            </View>
          </View>
        </Card>

        {/* Preset pills (kept for usability, not in prototype but functional) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
          {portionGramPresets.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => setGrams(preset)}
              style={{
                backgroundColor: grams === preset ? colors.ink : colors.surface,
                borderColor: grams === preset ? colors.ink : colors.line2,
                borderRadius: radius.pill,
                borderWidth: 1,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              }}
            >
              <Num style={{ color: grams === preset ? '#FFFFFF' : colors.ink, fontSize: typography.small, fontWeight: '600' }}>{preset}g</Num>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <StickyFooterButton label={t.applyAdjustment} onPress={() => onApply(adjustedMeal)} icon={<Check color="white" size={22} strokeWidth={2.4} />} />
    </View>
  );
}
