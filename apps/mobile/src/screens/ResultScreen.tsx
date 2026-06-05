import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Barcode, Droplets, Pencil, PencilLine, Scale, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react-native';
import type { FoodItem, Meal } from '../domain/types';
import type { MealCorrection } from '../domain/corrections';
import { buildScanTrustViewModel } from '../domain/scanTrust';
import { buildResultTrustViewModel, type ResultTrustItemRow } from '../ui/resultTrustViewModel';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, MacroBar, Num, ProofChip, Seal, ToleranceBar } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  onApplyCorrection: (correction: MealCorrection) => void;
  onAdjustItem?: (itemId: string) => void;
  onSave: () => void;
  onBack: () => void;
};

const STR = {
  en: {
    energy: 'Energy',
    estimatedRange: (label: string) => `Estimated range ${label}`,
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    proofLevel: 'Proof level',
    detectedFoods: (n: number) => `Detected foods (${n})`,
    edit: 'Edit',
    editFoods: 'Edit foods',
    noDetailedFoods: 'No detailed foods',
    noDetailedFoodsDetail: 'This meal comes from a global entry.',
    looksRight: 'Looks right?',
    saveMeal: 'Save meal',
    demoMode: 'Demo mode',
    demoDetail: 'AI analysis is not connected: this result is a fixed example for testing the photo, correction and Timeline flow.',
    quickCorrections: 'Quick corrections',
    correctionAteHalf: 'Ate half',
    correctionSmallerPortion: 'Smaller portion',
    correctionLargerPortion: 'Larger portion',
    correctionAddedOil: 'Added oil',
    correctionAddedSauce: 'Added sauce',
    correctionAddedCheese: 'Added cheese',
  },
  fr: {
    energy: 'Énergie',
    estimatedRange: (label: string) => `Plage estimée ${label}`,
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    proofLevel: 'Niveau de preuve',
    detectedFoods: (n: number) => `Aliments détectés (${n})`,
    edit: 'Modifier',
    editFoods: 'Modifier les aliments',
    noDetailedFoods: 'Aucun aliment détaillé',
    noDetailedFoodsDetail: 'Ce repas provient d\'une entrée globale.',
    looksRight: 'Ça vous semble bon ?',
    saveMeal: 'Enregistrer le repas',
    demoMode: 'Mode démo',
    demoDetail: 'L\'analyse IA n\'est pas connectée : ce résultat est un exemple fixe pour tester la photo, la correction et le flux Chronologie.',
    quickCorrections: 'Corrections rapides',
    correctionAteHalf: 'Mangé la moitié',
    correctionSmallerPortion: 'Portion plus petite',
    correctionLargerPortion: 'Portion plus grande',
    correctionAddedOil: 'Ajout d\'huile',
    correctionAddedSauce: 'Ajout de sauce',
    correctionAddedCheese: 'Ajout de fromage',
  },
};

type ProofTone = NonNullable<ReturnType<typeof buildResultTrustViewModel>['proofBadge']>['tone'];

function proofWash(tone: ProofTone): { bg: string; line: string; fg: string } {
  if (tone === 'green') {
    return { bg: colors.accentWash, line: colors.accentLine, fg: colors.accentInk };
  }
  if (tone === 'purple') {
    return { bg: colors.fiberWash, line: colors.fiberWash, fg: colors.fiber };
  }
  return { bg: colors.warnWash, line: colors.warnLine, fg: colors.warnInk };
}

function FoodThumb({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 }}>
      <Num style={{ color: colors.ink2, fontSize: 12, fontWeight: '600' }}>{initials || 'ML'}</Num>
    </View>
  );
}

function DetectedFoodRow({
  item,
  row,
  isLast,
  onAdjust,
  onRemove,
}: {
  item: FoodItem;
  row: ResultTrustItemRow | undefined;
  isLast: boolean;
  onAdjust?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
}) {
  return (
    <View style={{ alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: isLast ? 0 : 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 13 }}>
      <Pressable disabled={!onAdjust} onPress={() => onAdjust?.(item.id)} style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.md, minWidth: 0 }}>
        <FoodThumb name={item.name} />
        <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 13.5, fontWeight: '600' }}>{item.name}</Text>
          <Num numberOfLines={1} style={{ color: colors.muted, fontSize: 11 }}>{row?.quantityLabel} · {row?.caloriesLabel}</Num>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={() => onRemove(item.id)} style={{ alignItems: 'center', borderColor: colors.line2, borderRadius: radius.sm, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 }}>
          <Trash2 color={colors.muted} size={15} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function MacroLegendItem({ color, label, grams }: { color: string; label: string; grams: number }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
        <View style={{ backgroundColor: color, borderRadius: 2, height: 7, width: 7 }} />
        <Eyebrow>{label}</Eyebrow>
      </View>
      <Num style={{ fontSize: 16, fontWeight: '600', marginTop: 4 }}>{grams}g</Num>
    </View>
  );
}

export function ResultScreen({ meal, onApplyCorrection, onAdjustItem, onSave, onBack }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const usesPlaceholderImage = isManual || isProduct;
  const isMockAnalysis = meal.source === 'mock';
  const trust = buildScanTrustViewModel(meal);
  const resultTrust = buildResultTrustViewModel(meal);
  const proofBadge = resultTrust.proofBadge;
  const proofTone = proofBadge ? proofWash(proofBadge.tone) : null;
  const verified = proofBadge?.tone === 'green';

  const proteinKcal = meal.proteinG * 4;
  const carbsKcal = meal.carbsG * 4;
  const fatKcal = meal.fatG * 9;
  const macroTotal = proteinKcal + carbsKcal + fatKcal || 1;

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxxl + spacing.xl }} showsVerticalScrollIndicator={false}>
      {/* Hero capture */}
      <View style={{ height: 300, position: 'relative' }}>
        {usesPlaceholderImage ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, flex: 1, justifyContent: 'center' }}>
            {isProduct ? <Barcode color={colors.accentInk} size={64} strokeWidth={1.4} /> : <PencilLine color={colors.accentInk} size={60} strokeWidth={1.4} />}
          </View>
        ) : (
          <Image source={{ uri: meal.imageUri }} resizeMode="cover" style={{ backgroundColor: colors.paper2, flex: 1, width: '100%' }} />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', left: 0, paddingHorizontal: spacing.lg, position: 'absolute', right: 0, top: spacing.sm }}>
          <Pressable onPress={onBack} style={{ alignItems: 'center', backgroundColor: colors.scannerGlass, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 }}>
            <ArrowLeft color={colors.ink} size={19} strokeWidth={2.2} />
          </Pressable>
          {proofBadge ? <ProofChip level={verified ? 'verified' : 'estimated'} label={proofBadge.label} style={{ backgroundColor: colors.scannerGlass }} /> : null}
        </View>
      </View>

      <View style={{ gap: spacing.lg, padding: spacing.xl }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.heading, letterSpacing: -0.4 }}>{meal.mealName}</Text>
          {meal.notes && !meal.notes.startsWith('Remote analysis failed:') ? <Text numberOfLines={2} style={{ color: colors.muted, fontSize: typography.small }}>{meal.notes}</Text> : null}
        </View>

        {/* Energy + signature tolerance bar */}
        <View>
          <Eyebrow>{t.energy}</Eyebrow>
          <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Num style={{ fontSize: 44, fontWeight: '500', letterSpacing: -1.2 }}>{meal.caloriesEstimate}</Num>
            <Num style={{ color: colors.muted, fontSize: 14, marginBottom: 8 }}>kcal</Num>
          </View>
          <ToleranceBar low={meal.caloriesLow} high={meal.caloriesHigh} style={{ marginTop: 12 }} />
          <Eyebrow color={colors.muted2} style={{ marginTop: 7 }}>{t.estimatedRange(resultTrust.calorieRangeLabel)}</Eyebrow>
        </View>

        {/* Macros */}
        <View>
          <MacroBar
            height={10}
            segments={[
              { pct: (proteinKcal / macroTotal) * 100, color: colors.protein },
              { pct: (carbsKcal / macroTotal) * 100, color: colors.carbs },
              { pct: (fatKcal / macroTotal) * 100, color: colors.fat },
            ]}
          />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 12 }}>
            <MacroLegendItem color={colors.protein} label={t.protein} grams={meal.proteinG} />
            <MacroLegendItem color={colors.carbs} label={t.carbs} grams={meal.carbsG} />
            <MacroLegendItem color={colors.fat} label={t.fat} grams={meal.fatG} />
          </View>
        </View>

        {/* MetaboProof hero */}
        {proofBadge && proofTone ? (
          <View style={{ backgroundColor: proofTone.bg, borderColor: proofTone.line, borderRadius: radius.md, borderWidth: 1, padding: spacing.lg }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
              <Seal size={22} color={proofTone.fg} />
              <View style={{ flex: 1 }}>
                <Eyebrow color={proofTone.fg}>{t.proofLevel}</Eyebrow>
                <Text style={{ color: proofTone.fg, fontSize: typography.body, fontWeight: '700', marginTop: 2 }}>{proofBadge.label}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: proofTone.line, height: 1, marginVertical: 13 }} />
            <Text style={{ color: proofTone.fg, fontSize: typography.small, lineHeight: 19 }}>{resultTrust.sourceDetail}</Text>
          </View>
        ) : null}

        {/* Review prompt */}
        {resultTrust.reviewQuestion ? (
          <View style={{ backgroundColor: colors.warnWash, borderColor: colors.warnLine, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg }}>
            <Eyebrow color={colors.warnInk}>{resultTrust.reviewQuestion.title}</Eyebrow>
            <Text style={{ color: colors.warnInk, fontSize: typography.body, fontWeight: '600', lineHeight: 22 }}>{resultTrust.reviewQuestion.question}</Text>
            {onAdjustItem && meal.items.length > 0 ? (
              <Pressable onPress={() => onAdjustItem(meal.items[0].id)} style={{ alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: radius.sm, flexDirection: 'row', gap: 6, marginTop: 4, paddingHorizontal: spacing.md, paddingVertical: 9 }}>
                <Pencil color="#FFFFFF" size={14} strokeWidth={2.2} />
                <Text style={{ color: '#FFFFFF', fontSize: typography.small, fontWeight: '600' }}>{t.editFoods}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Detected foods */}
        <View style={{ gap: spacing.md }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Eyebrow>{t.detectedFoods(meal.items.length)}</Eyebrow>
            {meal.items.length > 0 && onAdjustItem ? (
              <Pressable onPress={() => onAdjustItem(meal.items[0].id)} style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
                <Pencil color={colors.accentInk} size={13} strokeWidth={2.2} />
                <Text style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600' }}>{t.edit}</Text>
              </Pressable>
            ) : null}
          </View>
          {meal.items.length === 0 ? (
            <Card style={{ gap: 4, padding: spacing.lg }}>
              <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.noDetailedFoods}</Text>
              <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19 }}>{t.noDetailedFoodsDetail}</Text>
            </Card>
          ) : (
            <Card style={{ overflow: 'hidden' }}>
              {meal.items.slice(0, 5).map((item, index) => (
                <DetectedFoodRow
                  key={item.id}
                  item={item}
                  isLast={index === Math.min(meal.items.length, 5) - 1}
                  row={resultTrust.items.find((candidate) => candidate.id === item.id)}
                  onAdjust={onAdjustItem}
                  onRemove={(itemId) => onApplyCorrection({ type: 'remove_item', targetItemId: itemId })}
                />
              ))}
            </Card>
          )}
        </View>

        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: typography.small }}>{t.looksRight}</Text>
          <ThumbsUp color={colors.muted} size={18} strokeWidth={2} />
          <ThumbsDown color={colors.muted} size={18} strokeWidth={2} />
        </View>

        <Pressable onPress={onSave} style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', paddingVertical: 17 }}>
          <Text style={{ color: '#FFFFFF', fontSize: typography.body, fontWeight: '700' }}>{t.saveMeal}</Text>
        </Pressable>

        {isMockAnalysis ? (
          <View style={{ backgroundColor: colors.warnWash, borderColor: colors.warnLine, borderRadius: radius.md, borderWidth: 1, gap: 4, padding: spacing.md }}>
            <Eyebrow color={colors.warnInk}>{t.demoMode}</Eyebrow>
            <Text style={{ color: colors.warnInk, fontSize: typography.small, lineHeight: 18 }}>
              {t.demoDetail}
            </Text>
            {meal.notes.startsWith('Remote analysis failed:') ? <Text style={{ color: colors.danger, fontSize: typography.small, lineHeight: 18 }}>{meal.notes}</Text> : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
