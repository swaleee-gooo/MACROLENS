import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Check, Minus, Plus, ShoppingBasket } from 'lucide-react-native';
import { calculatePackagedServingNutrition } from '../packagedFood/packagedServing';
import type { PackagedFoodItem } from '../packagedFood/packagedFoodSchema';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  item: PackagedFoodItem;
  initialServingGrams?: number;
  onBack: () => void;
  onAddProduct: (servingGrams: number) => void;
};

const servingPresets = [15, 30, 50, 100, 150];

function MetricCard({ label, value, unit, accent = colors.black }: { label: string; value: string; unit: string; accent?: string }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flex: 1, minWidth: 132, padding: spacing.md }}>
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: accent, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.xs }}>
        {value} <Text style={{ color: colors.muted, fontSize: typography.small }}>{unit}</Text>
      </Text>
    </View>
  );
}

function Per100gRow({ label, value, accent = colors.black }: { label: string; value: string; accent?: string }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: accent, fontSize: typography.small, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

export function PackagedProductScreen({ item, initialServingGrams = 30, onBack, onAddProduct }: Props) {
  const [servingGrams, setServingGrams] = useState(initialServingGrams);
  const nutrition = calculatePackagedServingNutrition(item, servingGrams);

  function updateServing(nextServingGrams: number) {
    setServingGrams(Math.max(1, Math.min(1000, nextServingGrams)));
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
        <ArrowLeft color={colors.black} size={28} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 70, justifyContent: 'center', width: 70 }}>
          <ShoppingBasket color={colors.green} size={34} strokeWidth={2.5} />
        </View>
        <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>{item.name}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>
          Produit scanne. Ajuste la portion consommee avant de l'ajouter au journal.
        </Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.xl, padding: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Portion</Text>
          <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>
            {servingGrams}
            <Text style={{ color: colors.muted, fontSize: typography.heading }}> g</Text>
          </Text>
        </View>

        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={() => updateServing(servingGrams - 5)} style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 58, justifyContent: 'center', width: 58 }}>
            <Minus color={colors.black} size={26} strokeWidth={2.8} />
          </Pressable>
          <Pressable onPress={() => updateServing(servingGrams + 5)} style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 58, justifyContent: 'center', width: 58 }}>
            <Plus color={colors.black} size={28} strokeWidth={2.8} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
          {servingPresets.map((preset) => {
            const selected = preset === servingGrams;
            return (
              <Pressable
                key={preset}
                onPress={() => updateServing(preset)}
                style={{
                  alignItems: 'center',
                  backgroundColor: selected ? colors.black : colors.surface,
                  borderColor: selected ? colors.black : colors.line,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  minWidth: 70,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text style={{ color: selected ? 'white' : colors.black, fontSize: typography.body, fontWeight: '900' }}>{preset}g</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Portion selectionnee</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <MetricCard label="Calories" value={`${nutrition.calories}`} unit="kcal" />
          <MetricCard label="Proteines" value={`${nutrition.proteinG}`} unit="g" accent={colors.green} />
          <MetricCard label="Glucides" value={`${nutrition.carbsG}`} unit="g" accent={colors.blue} />
          <MetricCard label="Lipides" value={`${nutrition.fatG}`} unit="g" accent={colors.amber} />
        </View>
      </View>

      <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, gap: spacing.sm, padding: spacing.md }}>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Valeurs pour 100 g</Text>
        <Per100gRow label="Calories" value={`${item.caloriesPer100g} kcal`} />
        <Per100gRow label="Proteines" value={`${item.proteinPer100g} g`} accent={colors.green} />
        <Per100gRow label="Glucides" value={`${item.carbsPer100g} g`} accent={colors.blue} />
        <Per100gRow label="Lipides" value={`${item.fatPer100g} g`} accent={colors.amber} />
      </View>

      <Pressable onPress={() => onAddProduct(servingGrams)} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 64 }}>
        <Check color="white" size={24} strokeWidth={2.7} />
        <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>Ajouter ce produit</Text>
      </Pressable>
    </ScrollView>
  );
}
