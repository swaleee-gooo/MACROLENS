import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Droplets, Minus, Package, Plus, Save, Scale, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import type { MealCorrection } from '../domain/corrections';
import { buildScanTrustViewModel } from '../domain/scanTrust';
import { buildResultTrustViewModel } from '../ui/resultTrustViewModel';
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
    <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, flex: 1, gap: spacing.xs, minWidth: 132, padding: spacing.md }}>
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: accent, fontSize: typography.subheading, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

function QuickCorrectionButton({ label, icon, onPress }: { label: string; icon: 'minus' | 'plus' | 'slider' | 'trash'; onPress: () => void }) {
  const Icon = icon === 'minus' ? Minus : icon === 'plus' ? Plus : icon === 'trash' ? Trash2 : SlidersHorizontal;
  const danger = icon === 'trash';

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: danger ? colors.redSoft : colors.surfaceMuted,
        borderColor: danger ? colors.redSoft : colors.line,
        borderRadius: radius.pill,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.xs,
        minHeight: 38,
        paddingHorizontal: spacing.md,
      }}
    >
      <Icon color={danger ? colors.red : colors.black} size={15} strokeWidth={2.6} />
      <Text style={{ color: danger ? colors.red : colors.black, fontSize: typography.tiny, fontWeight: '900' }}>{label}</Text>
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
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <ArrowLeft color={colors.black} size={28} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>MACROLENS</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{resultTrust.sourceLabel}</Text>
        </View>
        <View style={{ backgroundColor: confidenceTone.background, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Text style={{ color: confidenceTone.foreground, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{resultTrust.confidenceTitle}</Text>
        </View>
      </View>

      {usesPlaceholderImage ? (
        <View
          style={{
            alignItems: 'center',
            minHeight: 176,
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
        <Image source={{ uri: meal.imageUri }} style={{ aspectRatio: 1.12, borderRadius: radius.lg, width: '100%' }} />
      )}

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>{meal.mealName}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>{resultTrust.sourceDetail}</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <ShieldCheck color={colors.green} size={22} strokeWidth={2.4} />
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Controle avant sauvegarde</Text>
          </View>
          <ConfidenceBadge confidence={meal.confidence} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ backgroundColor: colors.black, borderRadius: radius.sm, flex: 1, padding: spacing.md }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories estimees</Text>
            <Text style={{ color: 'white', fontSize: typography.title, fontWeight: '900', marginTop: spacing.xs }}>{meal.caloriesEstimate}</Text>
            <Text style={{ color: '#EDEDED', fontSize: typography.small, fontWeight: '800' }}>kcal</Text>
          </View>
          <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, flex: 1, padding: spacing.md }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Plage probable</Text>
            <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900', marginTop: spacing.xs }}>{resultTrust.rangeLabel}</Text>
            <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>{trust.proteinLabel}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <MacroTile label="Proteines" value={`${meal.proteinG} g`} accent={colors.protein} />
          <MacroTile label="Glucides" value={`${meal.carbsG} g`} accent={colors.carbs} />
          <MacroTile label="Lipides" value={`${meal.fatG} g`} accent={colors.fat} />
          <MacroTile label="Fibres" value={`${meal.fiberG} g`} accent={colors.fiber} />
        </View>
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

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Aliments detectes</Text>
        {meal.items.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md }}>
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Aucun aliment detaille</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19 }}>
              Ce repas vient d'une saisie globale. Les corrections huile et sauce restent disponibles.
            </Text>
          </View>
        ) : (
        meal.items.map((item) => {
          const row = resultTrust.items.find((candidate) => candidate.id === item.id);

          return (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.md }}>
            <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{item.name}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', marginTop: spacing.xs }}>
                  {row?.quantityLabel} - {row?.caloriesLabel}
                </Text>
                <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', marginTop: spacing.xs }}>{row?.macroLine}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                <Text style={{ color: colors.green, fontSize: typography.tiny, fontWeight: '900' }}>{row?.confidenceLabel}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>{row?.sourceLabel}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <QuickCorrectionButton label="-15%" icon="minus" onPress={() => onApplyCorrection({ type: 'portion_down', targetItemId: item.id })} />
              <QuickCorrectionButton label="+15%" icon="plus" onPress={() => onApplyCorrection({ type: 'portion_up', targetItemId: item.id })} />
              {onAdjustItem ? <QuickCorrectionButton label="Grammes" icon="slider" onPress={() => onAdjustItem(item.id)} /> : null}
              {meal.items.length > 1 ? <QuickCorrectionButton label="Retirer" icon="trash" onPress={() => onApplyCorrection({ type: 'remove_item', targetItemId: item.id })} /> : null}
            </View>
          </View>
          );
        })
        )}
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
