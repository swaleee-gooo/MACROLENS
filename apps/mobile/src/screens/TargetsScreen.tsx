import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ChevronLeft, Edit2, Target } from 'lucide-react-native';
import { calculateMacroTargets } from '../domain/macroTargets';
import type { UserProfile } from '../domain/types';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, PrimaryButton, Seal } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    title: 'Targets & macros',
    autoCalc: 'Auto-calculated',
    autoChip: 'Auto',
    customise: 'Customise',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    fiber: 'Fiber',
    calorieOverride: 'Calorie override',
    calorieOverridePlaceholder: 'Optional calorie override',
    proteinOverride: 'Protein override',
    proteinOverridePlaceholder: 'Optional protein override',
    save: 'Save',
    noProfileTitle: 'Macro targets',
    noProfileBody: 'Create your profile to generate calorie and protein targets.',
    createProfile: 'Create my profile',
  },
  fr: {
    title: 'Cibles & macros',
    autoCalc: 'Calculé automatiquement',
    autoChip: 'Auto',
    customise: 'Personnaliser',
    calories: 'Calories',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    fiber: 'Fibres',
    calorieOverride: 'Calories personnalisées',
    calorieOverridePlaceholder: 'Remplacement calorique (optionnel)',
    proteinOverride: 'Protéines personnalisées',
    proteinOverridePlaceholder: 'Remplacement protéines (optionnel)',
    save: 'Enregistrer',
    noProfileTitle: 'Cibles de macros',
    noProfileBody: 'Créez votre profil pour générer des cibles de calories et de protéines.',
    createProfile: 'Créer mon profil',
  },
};

type Props = {
  profile: UserProfile | null;
  onBack: () => void;
  onCreateProfile: () => void;
  onSave: (profile: UserProfile) => void;
};

function numberOrNull(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function MacroRow({
  label,
  value,
  unit,
  dotColor,
  onEdit,
  isLast = false,
}: {
  label: string;
  value: string;
  unit: string;
  dotColor: string;
  onEdit: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => ({
        alignItems: 'center',
        borderBottomColor: colors.line,
        borderBottomWidth: isLast ? 0 : 1,
        flexDirection: 'row' as const,
        gap: 13,
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: 15,
        paddingVertical: 13,
      })}
    >
      <View style={{ backgroundColor: dotColor, borderRadius: 3, height: 10, width: 10 }} />
      <Text style={{ color: colors.ink, flex: 1, fontSize: 14, fontWeight: '500' }}>{label}</Text>
      <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4 }}>
        <Num style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{value}</Num>
        <Num style={{ color: colors.muted, fontSize: 11 }}>{unit}</Num>
      </View>
      <Edit2 color={colors.muted2} size={15} strokeWidth={2} />
    </Pressable>
  );
}

function OverrideInput({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: radius.md,
          borderWidth: 1,
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: '500',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      />
    </View>
  );
}

export function TargetsScreen({ profile, onBack, onCreateProfile, onSave }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [calorieOverride, setCalorieOverride] = useState(profile?.targets.calorieOverride ? String(profile.targets.calorieOverride) : '');
  const [proteinOverride, setProteinOverride] = useState(profile?.targets.proteinOverrideG ? String(profile.targets.proteinOverrideG) : '');

  if (!profile) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, padding: spacing.xl }}>
        {/* Push header */}
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl, paddingTop: 4 }}>
          <Pressable onPress={onBack} style={({ pressed }) => ({ alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: -6, opacity: pressed ? 0.7 : 1, width: 30 })}>
            <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
          </Pressable>
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600', letterSpacing: -0.1 }}>{t.title}</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={{ flex: 1, gap: spacing.xl, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderRadius: radius.lg, height: 72, justifyContent: 'center', width: 72 }}>
            <Target color={colors.accentInk} size={36} strokeWidth={1.75} />
          </View>
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.5 }}>{t.noProfileTitle}</Text>
            <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
              {t.noProfileBody}
            </Text>
          </View>
          <PrimaryButton label={t.createProfile} onPress={onCreateProfile} variant="accent" />
        </View>
      </View>
    );
  }

  const nextTargets = calculateMacroTargets({
    ...profile,
    targets: {
      ...profile.targets,
      calorieOverride: numberOrNull(calorieOverride),
      proteinOverrideG: numberOrNull(proteinOverride),
    },
  });

  function save() {
    if (!profile) {
      return;
    }

    onSave({
      ...profile,
      targets: nextTargets,
      updatedAt: new Date().toISOString(),
    });
  }

  const [customise, setCustomise] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>

      {/* Push header: back chevron + centered title */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
        <Pressable onPress={onBack} style={({ pressed }) => ({ alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: -6, opacity: pressed ? 0.7 : 1, width: 30 })}>
          <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
        </Pressable>
        <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600', letterSpacing: -0.1 }}>{t.title}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Auto-calorie accent card */}
      <Card style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, padding: spacing.lg }}>
        <View style={{ alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Eyebrow style={{ color: colors.accentInk }}>{t.autoCalc}</Eyebrow>
            <Num style={{ color: colors.accentInk, fontSize: 26, fontWeight: '600', marginTop: 5 }}>
              {nextTargets.calorieTarget} <Text style={{ fontSize: 13 }}>kcal</Text>
            </Num>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Seal size={12} color={colors.accentInk} />
            <Text style={{ color: colors.accentInk, fontSize: 10, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>{t.autoChip}</Text>
          </View>
        </View>
      </Card>

      {/* Customise toggle row */}
      <Pressable
        onPress={() => setCustomise((v) => !v)}
        style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}
      >
        <Eyebrow>{t.customise}</Eyebrow>
        <View style={{ backgroundColor: customise ? colors.accent : colors.line2, borderRadius: 999, height: 24, justifyContent: 'center', width: 40 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, height: 20, left: customise ? 18 : 2, position: 'absolute', top: 2, width: 20 }} />
        </View>
      </Pressable>

      {/* Macro rows */}
      <Card style={{ overflow: 'hidden' }}>
        <MacroRow label={t.calories} value={String(nextTargets.calorieTarget)} unit="kcal" dotColor={colors.ink} onEdit={() => undefined} />
        <MacroRow label={t.protein} value={String(nextTargets.proteinTargetG)} unit="g" dotColor={colors.protein} onEdit={() => undefined} />
        <MacroRow label={t.carbs} value={String(nextTargets.carbsTargetG)} unit="g" dotColor={colors.carbs} onEdit={() => undefined} />
        <MacroRow label={t.fat} value={String(nextTargets.fatTargetG)} unit="g" dotColor={colors.fat} onEdit={() => undefined} />
        <MacroRow label={t.fiber} value={String(nextTargets.fiberTargetG)} unit="g" dotColor={colors.fiber} onEdit={() => undefined} isLast />
      </Card>

      {/* Custom override inputs (shown when customise is on) */}
      {customise ? (
        <Card style={{ gap: spacing.lg, padding: spacing.lg }}>
          <OverrideInput label={t.calorieOverride} value={calorieOverride} onChangeText={setCalorieOverride} placeholder={t.calorieOverridePlaceholder} />
          <OverrideInput label={t.proteinOverride} value={proteinOverride} onChangeText={setProteinOverride} placeholder={t.proteinOverridePlaceholder} />
        </Card>
      ) : null}

      {/* Save */}
      <PrimaryButton label={t.save} onPress={save} variant="dark" />
    </ScrollView>
  );
}
