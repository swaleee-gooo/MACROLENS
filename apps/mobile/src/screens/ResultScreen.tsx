import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Droplets, Package, Pencil, Save, Scale, ShieldCheck } from 'lucide-react-native';
import type { FoodItem, Meal } from '../domain/types';
import type { MealCorrection } from '../domain/corrections';
import { buildScanTrustViewModel } from '../domain/scanTrust';
import { buildResultTrustViewModel, type ResultTrustItemRow } from '../ui/resultTrustViewModel';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  onApplyCorrection: (correction: MealCorrection) => void;
  onAdjustItem?: (itemId: string) => void;
  onSave: () => void;
  onBack: () => void;
};

const correctionButtons: { label: string; correction: MealCorrection; icon: 'scale' | 'droplets' }[] = [
  { label: 'Huile ajoutee', correction: { type: 'add_oil', targetItemId: null }, icon: 'droplets' },
  { label: 'Sauce ajoutee', correction: { type: 'add_sauce', targetItemId: null }, icon: 'droplets' },
];

function confidenceColors(confidence: Meal['confidence']) {
  if (confidence === 'high') {
    return { background: colors.greenSoft, foreground: colors.green };
  }

  if (confidence === 'medium') {
    return { background: colors.amberSoft, foreground: colors.amber };
  }

  return { background: colors.redSoft, foreground: colors.red };
}

function MacroTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: spacing.xs, minWidth: 94, padding: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ backgroundColor: accent, borderRadius: radius.pill, height: 8, width: 8 }} />
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>{label}</Text>
      </View>
      <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

function FoodThumb({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 36, justifyContent: 'center', width: 36 }}>
      <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>{initials || 'ML'}</Text>
    </View>
  );
}

function DetectedFoodRow({
  item,
  row,
  onAdjust,
}: {
  item: FoodItem;
  row: ResultTrustItemRow | undefined;
  onAdjust?: (itemId: string) => void;
}) {
  function adjustItem() {
    if (onAdjust) {
      onAdjust(item.id);
    }
  }

  return (
    <Pressable
      disabled={!onAdjust}
      onPress={adjustItem}
      style={{ alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 62, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
    >
      <FoodThumb name={item.name} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text numberOfLines={1} style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>{item.name}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>{row?.caloriesLabel} - {row?.quantityLabel}</Text>
      </View>
    </Pressable>
  );
}

export function ResultScreen({ meal, onApplyCorrection, onAdjustItem, onSave, onBack }: Props) {
  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const usesPlaceholderImage = isManual || isProduct;
  const isMockAnalysis = meal.source === 'mock';
  const trust = buildScanTrustViewModel(meal);
  const resultTrust = buildResultTrustViewModel(meal);
  const confidenceTone = confidenceColors(meal.confidence);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.xl }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', height: 42, justifyContent: 'center', width: 42 }}>
          <ArrowLeft color={colors.black} size={24} strokeWidth={2.6} />
        </Pressable>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Scan result</Text>
        <View style={{ backgroundColor: confidenceTone.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
          <Text style={{ color: confidenceTone.foreground, fontSize: typography.tiny, fontWeight: '900' }}>{resultTrust.confidenceTitle}</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.lg }}>
        {usesPlaceholderImage ? (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.lg,
              borderWidth: 1,
              height: 122,
              justifyContent: 'center',
              width: 142,
            }}
          >
            {isProduct ? <Package color={colors.green} size={52} strokeWidth={1.8} /> : <Scale color={colors.green} size={52} strokeWidth={1.8} />}
          </View>
        ) : (
          <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, height: 122, width: 142 }} />
        )}
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>{resultTrust.calorieRangeLabel}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>Estimated range</Text>
          <Text numberOfLines={2} style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', lineHeight: 16 }}>{meal.mealName}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <MacroTile label="Protein" value={resultTrust.macroRanges.protein} accent={colors.protein} />
        <MacroTile label="Carbs" value={resultTrust.macroRanges.carbs} accent={colors.carbs} />
        <MacroTile label="Fat" value={resultTrust.macroRanges.fat} accent={colors.fat} />
      </View>

      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Detected foods ({meal.items.length})</Text>
          {meal.items.length > 0 && onAdjustItem ? (
            <Pressable onPress={() => onAdjustItem(meal.items[0].id)} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
              <Pencil color={colors.green} size={14} strokeWidth={2.5} />
              <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
        {meal.items.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.lg }}>
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Aucun aliment detaille</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19 }}>Ce repas vient d'une saisie globale.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' }}>
            {meal.items.slice(0, 5).map((item) => (
              <DetectedFoodRow key={item.id} item={item} row={resultTrust.items.find((candidate) => candidate.id === item.id)} onAdjust={onAdjustItem} />
            ))}
          </View>
        )}
      </View>

      <Pressable
        onPress={onSave}
        style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 58, paddingHorizontal: spacing.lg }}
      >
        <Save color="white" size={19} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Save meal</Text>
      </Pressable>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <ShieldCheck color={colors.green} size={22} strokeWidth={2.4} />
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Review details</Text>
          </View>
          <ConfidenceBadge confidence={meal.confidence} />
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 20 }}>{resultTrust.sourceDetail}</Text>
        <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>{trust.proteinLabel}</Text>
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

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>{resultTrust.explanationTitle}</Text>
        {resultTrust.explanationBullets.map((bullet) => (
          <View key={bullet} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ backgroundColor: colors.green, borderRadius: radius.pill, height: 7, marginTop: 8, width: 7 }} />
            <Text style={{ color: colors.muted, flex: 1, fontSize: typography.small, fontWeight: '800', lineHeight: 20 }}>{bullet}</Text>
          </View>
        ))}
        {trust.prompts.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {trust.prompts.map((prompt) => (
              <View key={prompt} style={{ backgroundColor: colors.amberSoft, borderColor: colors.amber, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
                <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>{prompt}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Corrections globales</Text>
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

    </ScrollView>
  );
}
