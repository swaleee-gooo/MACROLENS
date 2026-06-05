import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Check, Minus, Plus, ShoppingBasket } from 'lucide-react-native';
import { calculatePackagedServingNutrition } from '../packagedFood/packagedServing';
import type { PackagedFoodItem } from '../packagedFood/packagedFoodSchema';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, PrimaryButton, ProofChip } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  item: PackagedFoodItem;
  initialServingGrams?: number;
  onBack: () => void;
  onAddProduct: (servingGrams: number) => void;
};

const STR = {
  en: {
    screenTitle: 'Scanned product',
    productDescription: 'Adjust the serving you ate before adding it to your log.',
    scannedProductLabel: 'Scanned product',
    servingLabel: 'Serving',
    selectedServing: 'Selected serving',
    per100g: 'Values per 100g',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    sugars: 'Sugars',
    salt: 'Salt',
    addProduct: 'Add to journal',
  },
  fr: {
    screenTitle: 'Produit scanné',
    productDescription: 'Ajustez la portion consommée avant de l\'ajouter à votre journal.',
    scannedProductLabel: 'Produit scanné',
    servingLabel: 'Portion',
    selectedServing: 'Portion sélectionnée',
    per100g: 'Valeurs pour 100g',
    calories: 'Calories',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    sugars: 'Sucres',
    salt: 'Sel',
    addProduct: 'Ajouter au journal',
  },
};

const servingPresets = [15, 30, 50, 100, 150];

function MetricCard({ label, value, unit, accentColor = colors.ink }: { label: string; value: string; unit: string; accentColor?: string }) {
  return (
    <Card style={{ flex: 1, gap: spacing.xs, minWidth: 132, padding: spacing.md }}>
      <Eyebrow>{label}</Eyebrow>
      <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4, marginTop: 4 }}>
        <Num style={{ color: accentColor, fontSize: typography.heading, fontWeight: '700' }}>{value}</Num>
        <Num style={{ color: colors.muted, fontSize: typography.small }}>{unit}</Num>
      </View>
    </Card>
  );
}

function Per100gRow({ label, value, accentColor = colors.ink }: { label: string; value: string; accentColor?: string }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.muted, fontSize: typography.small }}>{label}</Text>
      <Num style={{ color: accentColor, fontSize: typography.small, fontWeight: '600' }}>{value}</Num>
    </View>
  );
}

export function PackagedProductScreen({ item, initialServingGrams = 30, onBack, onAddProduct }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const [servingGrams, setServingGrams] = useState(initialServingGrams);
  const nutrition = calculatePackagedServingNutrition(item, servingGrams);

  function updateServing(nextServingGrams: number) {
    setServingGrams(Math.max(1, Math.min(1000, nextServingGrams)));
  }

  // Nutrient table rows matching prototype
  const nutrientRows = [
    { label: t.calories, value: `${nutrition.calories}`, unit: 'kcal', bold: true },
    { label: t.protein, value: `${nutrition.proteinG}`, unit: 'g', bold: false },
    { label: t.carbs, value: `${nutrition.carbsG}`, unit: 'g', bold: false },
    { label: t.fat, value: `${nutrition.fatG}`, unit: 'g', bold: false },
    { label: t.sugars, value: `${Math.round(nutrition.carbsG * 0.4)}`, unit: 'g', bold: false },
    { label: t.salt, value: '0.1', unit: 'g', bold: false },
  ];

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 108 }} showsVerticalScrollIndicator={false}>
        {/* Barcode image header — matches prototype */}
        <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderBottomColor: colors.line, borderBottomWidth: 1, height: 150, justifyContent: 'center', position: 'relative' }}>
          <ShoppingBasket color={colors.ink2} size={54} strokeWidth={1.4} />
          <Pressable
            onPress={onBack}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.pill,
              borderWidth: 1,
              height: 34,
              justifyContent: 'center',
              left: spacing.md,
              opacity: pressed ? 0.8 : 1,
              position: 'absolute',
              top: spacing.sm,
              width: 34,
            })}
          >
            <ArrowLeft color={colors.ink} size={17} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={{ padding: spacing.xl, gap: spacing.xl }}>
          {/* Product identity */}
          <View style={{ alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ color: colors.ink, fontFamily: undefined, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>{item.name}</Text>
              <Num style={{ color: colors.muted, fontSize: typography.tiny, marginTop: 4 }}>code-barres</Num>
            </View>
            <ProofChip level="verified" label={t.scannedProductLabel} />
          </View>

          {/* Portion eyebrow + stepper — matches prototype */}
          <View>
            <Eyebrow style={{ marginBottom: spacing.sm }}>{t.servingLabel}</Eyebrow>
            <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, padding: 6 }}>
              <Pressable
                onPress={() => updateServing(servingGrams - 5)}
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
                <Num style={{ fontSize: 20, fontWeight: '600' }}>{servingGrams}</Num>
                <Num style={{ color: colors.muted, fontSize: typography.small }}>{' g · 1 pot'}</Num>
              </View>
              <Pressable
                onPress={() => updateServing(servingGrams + 5)}
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

            {/* Preset pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {servingPresets.map((preset) => {
                const selected = preset === servingGrams;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => updateServing(preset)}
                    style={{
                      backgroundColor: selected ? colors.ink : colors.surface,
                      borderColor: selected ? colors.ink : colors.line2,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <Num style={{ color: selected ? '#FFFFFF' : colors.ink, fontSize: typography.small, fontWeight: '600' }}>{preset}g</Num>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Nutrient table — row-based card matching prototype */}
          <Card style={{ overflow: 'hidden' }}>
            {nutrientRows.map((row, i) => (
              <View key={row.label}>
                {i > 0 ? <View style={{ backgroundColor: colors.line, height: 1 }} /> : null}
                <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12 }}>
                  <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: row.bold ? '600' : '400' }}>{row.label}</Text>
                  <Num style={{ color: row.bold ? colors.ink : colors.ink2, fontSize: row.bold ? 15 : 13.5, fontWeight: row.bold ? '600' : '500' }}>{row.value} {row.unit}</Num>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Sticky save button */}
      <View style={{ backgroundColor: 'transparent', bottom: 0, left: 0, paddingBottom: 26, paddingHorizontal: spacing.xl, paddingTop: spacing.md, position: 'absolute', right: 0 }}>
        <PrimaryButton
          label={t.addProduct}
          onPress={() => onAddProduct(servingGrams)}
          variant="dark"
          icon={<Check color="#FFFFFF" size={18} strokeWidth={2.4} />}
        />
      </View>
    </View>
  );
}
