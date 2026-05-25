import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Droplets, Package, Save, Scale, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import type { MealCorrection } from '../domain/corrections';
import { buildScanTrustViewModel } from '../domain/scanTrust';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { MetricPill } from '../components/MetricPill';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  onApplyCorrection: (correction: MealCorrection) => void;
  onAdjustItem?: (itemId: string) => void;
  onSave: () => void;
  onBack: () => void;
};

const correctionButtons: { label: string; correction: MealCorrection; icon: 'scale' | 'droplets' }[] = [
  { label: 'Portion +15%', correction: { type: 'portion_up', targetItemId: null }, icon: 'scale' },
  { label: 'Portion -15%', correction: { type: 'portion_down', targetItemId: null }, icon: 'scale' },
  { label: 'Huile ajoutee', correction: { type: 'add_oil', targetItemId: null }, icon: 'droplets' },
  { label: 'Sauce ajoutee', correction: { type: 'add_sauce', targetItemId: null }, icon: 'droplets' },
];

export function ResultScreen({ meal, onApplyCorrection, onAdjustItem, onSave, onBack }: Props) {
  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const usesPlaceholderImage = isManual || isProduct;
  const isMockAnalysis = meal.source === 'mock';
  const trust = buildScanTrustViewModel(meal);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <ArrowLeft color={colors.black} size={28} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>MACROLENS</Text>
      </Pressable>
      {usesPlaceholderImage ? (
        <View
          style={{
            alignItems: 'center',
            aspectRatio: 1,
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.lg,
            borderWidth: 1,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {isProduct ? <Package color={colors.green} size={72} strokeWidth={1.8} /> : <Scale color={colors.green} size={72} strokeWidth={1.8} />}
        </View>
      ) : (
        <Image source={{ uri: meal.imageUri }} style={{ aspectRatio: 1, borderRadius: radius.lg, width: '100%' }} />
      )}
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>{meal.mealName}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>
          {isProduct ? 'Produit enregistre depuis une base nutritionnelle. Verifie seulement la portion consommee.' : "Une estimation photo reste une plage. Verifie les portions visibles avant d'enregistrer."}
        </Text>
      </View>
      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <ShieldCheck color={colors.green} size={22} strokeWidth={2.4} />
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Fiabilite du scan</Text>
          </View>
          <ConfidenceBadge confidence={meal.confidence} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, flex: 1, padding: spacing.md }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories estimees</Text>
            <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.xs }}>{meal.caloriesEstimate}</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>kcal</Text>
          </View>
          <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, flex: 1, padding: spacing.md }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Plage probable</Text>
            <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900', marginTop: spacing.xs }}>{trust.calorieRangeLabel}</Text>
            <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>{trust.proteinLabel}</Text>
          </View>
        </View>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>{trust.confidenceLabel}</Text>
        {trust.prompts.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>A verifier</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {trust.prompts.map((prompt) => (
                <View key={prompt} style={{ backgroundColor: colors.amberSoft, borderColor: colors.amber, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
                  <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>{prompt}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
      {isMockAnalysis ? (
        <View
          style={{
            backgroundColor: '#FFF7E8',
            borderColor: '#F1C27D',
            borderRadius: radius.sm,
            borderWidth: 1,
            gap: spacing.xs,
            padding: spacing.md,
          }}
        >
          <Text style={{ color: colors.amber, fontSize: typography.small, fontWeight: '900' }}>Mode demo</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
            Analyse IA non branchee: ce resultat est un exemple fixe pour tester le flux photo, corrections et Timeline.
          </Text>
          {meal.notes.startsWith('Remote analysis failed:') ? (
            <Text style={{ color: colors.red, fontSize: typography.small, lineHeight: 18 }}>{meal.notes}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <MetricPill label="Proteines" value={`${meal.proteinG} g`} accent={colors.protein} />
        <MetricPill label="Glucides" value={`${meal.carbsG} g`} accent={colors.carbs} />
        <MetricPill label="Lipides" value={`${meal.fatG} g`} accent={colors.fat} />
        <MetricPill label="Fibres" value={`${meal.fiberG} g`} accent={colors.fiber} />
      </View>
      {onAdjustItem && meal.items[0] ? (
        <Pressable
          onPress={() => onAdjustItem(meal.items[0].id)}
          style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.lg }}
        >
          <SlidersHorizontal color="white" size={20} strokeWidth={2.5} />
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Ajuster les quantites</Text>
        </Pressable>
      ) : null}
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Corrections rapides</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {correctionButtons.map((button) => {
            const Icon = button.icon === 'scale' ? Scale : Droplets;

            return (
              <Pressable
                key={button.label}
                onPress={() => onApplyCorrection(button.correction)}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                }}
              >
                <Icon color={colors.ink} size={16} strokeWidth={2.4} />
                <Text style={{ color: colors.ink, fontWeight: '800' }}>{button.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Aliments detectes</Text>
        {meal.items.map((item) => (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, padding: spacing.md }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{item.name}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.small }}>
                  {item.estimatedQuantity} {item.unit} - {item.calories} kcal - {item.proteinG} g proteines
                </Text>
              </View>
              {meal.items.length > 1 ? (
                <Pressable onPress={() => onApplyCorrection({ type: 'remove_item', targetItemId: item.id })}>
                  <Trash2 color={colors.red} size={18} strokeWidth={2.4} />
                </Pressable>
              ) : null}
              {onAdjustItem ? (
                <Pressable onPress={() => onAdjustItem(item.id)} style={{ padding: spacing.xs }}>
                  <SlidersHorizontal color={colors.black} size={18} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onSave}
        style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.lg }}
      >
        <Save color="white" size={20} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Enregistrer le repas</Text>
      </Pressable>
    </ScrollView>
  );
}
