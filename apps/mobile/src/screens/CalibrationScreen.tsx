import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Plus, Scale, Sparkles } from 'lucide-react-native';
import { calculatePersonalPortionFactor, calibrationProgress, createCalibrationSample, type CalibrationSample } from '../metaboproof/calibrationEngine';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, PrimaryButton } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
  onCreateCalibratedMeal: (portionFactor: number) => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Calibration',
    improveTitle: 'Improve your results',
    improveSubtitle: 'Weigh 5 meals to calibrate the visual reading.',
    description: 'Log five photo meals with real scale weights. MetaboProof learns a personal portion factor and labels future output as calibrated, not verified.',
    progressLabel: 'Progress',
    weighedMeals: (completed: number, required: number) => `${completed} / ${required}`,
    currentMargin: 'Current margin',
    targetMargin: 'Target margin',
    remaining: (n: number) => `${n} remaining`,
    factorLabel: 'Factor',
    calibratedMeals: 'Calibrated meals',
    weighed: 'Weighed',
    toWeigh: 'to weigh',
    predictedKcal: 'Predicted kcal',
    verifiedKcal: 'Verified kcal',
    predictedG: 'Predicted g',
    scaleG: 'Scale g',
    addSample: 'Add calibration sample',
    recentSamples: 'Recent samples',
    mealLabel: (n: number) => `Meal ${n}`,
    errorLabel: (kcal: number) => `Error ${kcal} kcal`,
    createCalibratedResult: 'Weigh a meal',
  },
  fr: {
    brand: 'MacroLens',
    title: 'Calibration',
    improveTitle: 'Améliore tes résultats',
    improveSubtitle: 'Pèse 5 repas pour calibrer l\'estimation visuelle.',
    description: 'Enregistrez cinq repas photo avec des poids réels à la balance. MetaboProof calcule un facteur de portion personnalisé et étiquette les futures sorties comme calibrées, non vérifiées.',
    progressLabel: 'Progression',
    weighedMeals: (completed: number, required: number) => `${completed} / ${required}`,
    currentMargin: 'Marge actuelle',
    targetMargin: 'Marge visée',
    remaining: (n: number) => `${n} restant(s)`,
    factorLabel: 'Facteur',
    calibratedMeals: 'Repas calibrés',
    weighed: 'Pesé',
    toWeigh: 'à peser',
    predictedKcal: 'Kcal estimées',
    verifiedKcal: 'Kcal confirmées',
    predictedG: 'Grammes estimés',
    scaleG: 'Grammes balance',
    addSample: 'Ajouter un échantillon de calibration',
    recentSamples: 'Échantillons récents',
    mealLabel: (n: number) => `Repas ${n}`,
    errorLabel: (kcal: number) => `Écart ${kcal} kcal`,
    createCalibratedResult: 'Peser un repas',
  },
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function Input({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.xs, minWidth: 132 }}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        style={{ borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: typography.small, fontWeight: '600', minHeight: 44, paddingHorizontal: spacing.md }}
      />
    </View>
  );
}

export function CalibrationScreen({ onBack, onCreateCalibratedMeal }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const [samples, setSamples] = useState<CalibrationSample[]>([]);
  const [predictedKcal, setPredictedKcal] = useState('520');
  const [verifiedKcal, setVerifiedKcal] = useState('570');
  const [predictedGrams, setPredictedGrams] = useState('420');
  const [verifiedGrams, setVerifiedGrams] = useState('470');
  const progress = calibrationProgress(samples);
  const factor = calculatePersonalPortionFactor(samples);
  const canAdd = parseNumber(predictedKcal) > 0 && parseNumber(verifiedKcal) > 0 && parseNumber(predictedGrams) > 0 && parseNumber(verifiedGrams) > 0;

  function addSample() {
    if (!canAdd) {
      return;
    }

    setSamples((current) => [
      ...current,
      createCalibrationSample({
        id: `calibration-${Date.now()}`,
        userId: 'local-user',
        imageHash: `local-hash-${current.length + 1}`,
        foods: ['meal'],
        predictedKcal: parseNumber(predictedKcal),
        verifiedKcal: parseNumber(verifiedKcal),
        predictedGrams: parseNumber(predictedGrams),
        verifiedGrams: parseNumber(verifiedGrams),
        modelId: 'visual-mock',
        createdAt: new Date().toISOString(),
      }),
    ]);
  }

  // Build a representative meal list (prototype shows 5 fixed meal names)
  const mealNames = lang === 'fr'
    ? ['Petit-déj œufs', 'Bowl déjeuner', 'Dîner pâtes', 'Snack', 'Repas libre']
    : ['Breakfast eggs', 'Lunch bowl', 'Pasta dinner', 'Snack', 'Free meal'];

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      {/* Push header with icon — matches prototype */}
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm }}>
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
        <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 13, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 }}>
          <Scale color={colors.accent} size={24} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 }}>{t.improveTitle}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16, marginTop: 3 }}>{t.improveSubtitle}</Text>
        </View>
      </View>

      {/* Progress card — matches prototype with bar + current/target margin */}
      <Card style={{ gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Eyebrow>{t.progressLabel}</Eyebrow>
          <Num style={{ fontSize: 14, fontWeight: '600' }}>{t.weighedMeals(progress.completedSamples, progress.requiredSamples)}</Num>
        </View>
        <View style={{ backgroundColor: colors.paper3, borderRadius: radius.pill, height: 6, overflow: 'hidden' }}>
          <View style={{
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            height: 6,
            width: `${Math.min(100, (progress.completedSamples / progress.requiredSamples) * 100)}%`,
          }} />
        </View>
        {/* Current → target margin row */}
        <View style={{ alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.md }}>
          <View>
            <Eyebrow>{t.currentMargin}</Eyebrow>
            <Num style={{ fontSize: 17, fontWeight: '600', marginTop: 3 }}>±9%</Num>
          </View>
          <Scale color={colors.accent} size={18} strokeWidth={2} />
          <View style={{ alignItems: 'flex-end' }}>
            <Eyebrow>{t.targetMargin}</Eyebrow>
            <Num style={{ color: colors.accentInk, fontSize: 17, fontWeight: '600', marginTop: 3 }}>±4%</Num>
          </View>
        </View>
      </Card>

      {/* Calibrated meal list — matches prototype (done/todo) */}
      <Eyebrow style={{ marginBottom: -spacing.md }}>{t.calibratedMeals}</Eyebrow>
      {mealNames.map((mealName, i) => {
        const done = i < progress.completedSamples;
        return (
          <Card key={mealName} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: -spacing.sm, opacity: done ? 1 : 0.6, padding: spacing.md }}>
            <View style={{
              alignItems: 'center',
              backgroundColor: done ? colors.accent : colors.paper3,
              borderRadius: radius.pill,
              height: 24,
              justifyContent: 'center',
              width: 24,
            }}>
              {done ? (
                <Scale color="#FFFFFF" size={13} strokeWidth={2} />
              ) : (
                <Scale color={colors.muted} size={13} strokeWidth={2} />
              )}
            </View>
            <Text style={{ color: colors.ink, flex: 1, fontSize: 13.5, fontWeight: '500' }}>{mealName}</Text>
            {done
              ? <Text style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600' }}>{t.weighed}</Text>
              : <Text style={{ color: colors.muted, fontSize: typography.small }}>{t.toWeigh}</Text>}
          </Card>
        );
      })}

      {/* Input fields */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Input label={t.predictedKcal} value={predictedKcal} onChangeText={setPredictedKcal} placeholder="520" />
        <Input label={t.verifiedKcal} value={verifiedKcal} onChangeText={setVerifiedKcal} placeholder="570" />
        <Input label={t.predictedG} value={predictedGrams} onChangeText={setPredictedGrams} placeholder="420" />
        <Input label={t.scaleG} value={verifiedGrams} onChangeText={setVerifiedGrams} placeholder="470" />
      </View>

      {/* Add sample button */}
      <Pressable
        disabled={!canAdd}
        onPress={addSample}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: canAdd ? colors.surface : colors.paper3,
          borderColor: canAdd ? colors.line : colors.line2,
          borderRadius: radius.lg,
          borderWidth: 1,
          flexDirection: 'row' as const,
          gap: spacing.sm,
          justifyContent: 'center',
          minHeight: 50,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Plus color={canAdd ? colors.ink2 : colors.muted} size={16} strokeWidth={2} />
        <Text style={{ color: canAdd ? colors.ink : colors.muted, fontSize: typography.small, fontWeight: '600' }}>{t.addSample}</Text>
      </Pressable>

      {/* Sample history */}
      {samples.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Eyebrow>{t.recentSamples}</Eyebrow>
          {samples.slice(-5).map((sample, index) => (
            <View key={sample.id} style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md }}>
              <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '600' }}>{t.mealLabel(index + 1)}</Text>
              <Num style={{ color: colors.muted, fontSize: typography.small }}>{t.errorLabel(sample.kcalError)}</Num>
            </View>
          ))}
        </View>
      ) : null}

      {/* Create calibrated result */}
      <PrimaryButton
        label={t.createCalibratedResult}
        onPress={() => onCreateCalibratedMeal(factor)}
        disabled={!progress.ready}
        variant="dark"
        icon={<Sparkles color="#FFFFFF" size={17} strokeWidth={2} />}
      />
    </ScrollView>
  );
}
