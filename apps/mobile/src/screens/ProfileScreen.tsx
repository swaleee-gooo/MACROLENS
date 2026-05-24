import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { calculateMacroTargets } from '../domain/macroTargets';
import type { MacroTargets, UserGoal, UserProfile } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  profile: UserProfile | null;
  userId: string;
  onBack: () => void;
  onSave: (profile: UserProfile) => void;
};

const emptyTargets: MacroTargets = {
  calorieTarget: 0,
  proteinTargetG: 0,
  carbsTargetG: 0,
  fatTargetG: 0,
  fiberTargetG: 0,
  calorieOverride: null,
  proteinOverrideG: null,
};

const goals: { value: UserGoal; label: string }[] = [
  { value: 'lose_fat', label: 'Perdre du gras' },
  { value: 'build_muscle', label: 'Muscle' },
  { value: 'maintain', label: 'Maintien' },
  { value: 'understand_eating', label: 'Comprendre' },
];

const ageRanges: UserProfile['ageRange'][] = ['18-24', '25-34', '35-44', '45-54', '55+'];

const activityLevels: { value: UserProfile['activityLevel']; label: string }[] = [
  { value: 'low', label: 'Calme' },
  { value: 'moderate', label: 'Actif' },
  { value: 'high', label: 'Sportif' },
];

function parsePositiveNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function OptionButton<T extends string>({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(value)}
      style={{
        backgroundColor: selected ? colors.green : colors.surface,
        borderColor: selected ? colors.green : colors.line,
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={{ color: selected ? 'white' : colors.ink, fontSize: typography.small, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export function ProfileScreen({ profile, userId, onBack, onSave }: Props) {
  const [goal, setGoal] = useState<UserGoal>(profile?.goal ?? 'lose_fat');
  const [ageRange, setAgeRange] = useState<UserProfile['ageRange']>(profile?.ageRange ?? '25-34');
  const [sex, setSex] = useState<UserProfile['sex']>(profile?.sex ?? 'prefer_not_to_say');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [targetWeightKg, setTargetWeightKg] = useState(profile?.targetWeightKg ? String(profile.targetWeightKg) : '');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(profile?.activityLevel ?? 'moderate');

  const height = parsePositiveNumber(heightCm);
  const weight = parsePositiveNumber(weightKg);
  const canSave = height >= 120 && height <= 230 && weight >= 35 && weight <= 250;
  const preview = useMemo(() => {
    if (!canSave) {
      return null;
    }

    return calculateMacroTargets({
      id: userId,
      goal,
      ageRange,
      sex,
      heightCm: height,
      weightKg: weight,
      activityLevel,
      targetWeightKg: targetWeightKg.trim() ? parsePositiveNumber(targetWeightKg) : null,
      targets: profile?.targets ?? emptyTargets,
      updatedAt: profile?.updatedAt ?? new Date().toISOString(),
    });
  }, [activityLevel, ageRange, canSave, goal, height, profile?.targets, profile?.updatedAt, sex, targetWeightKg, userId, weight]);

  function save() {
    if (!canSave || !preview) {
      return;
    }

    onSave({
      id: userId,
      goal,
      ageRange,
      sex,
      heightCm: height,
      weightKg: weight,
      activityLevel,
      targetWeightKg: targetWeightKg.trim() ? parsePositiveNumber(targetWeightKg) : null,
      targets: preview,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Profil</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
          Ces donnees servent uniquement a personnaliser tes objectifs locaux.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Objectif</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {goals.map((item) => (
            <OptionButton key={item.value} label={item.label} value={item.value} selected={goal === item.value} onSelect={setGoal} />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Age</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {ageRanges.map((item) => (
            <OptionButton key={item} label={item} value={item} selected={ageRange === item} onSelect={setAgeRange} />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Sexe</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <OptionButton label="Femme" value="female" selected={sex === 'female'} onSelect={setSex} />
          <OptionButton label="Homme" value="male" selected={sex === 'male'} onSelect={setSex} />
          <OptionButton label="Neutre" value="prefer_not_to_say" selected={sex === 'prefer_not_to_say'} onSelect={setSex} />
        </View>
      </View>

      <TextInput
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
        placeholder="Taille en cm"
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />
      <TextInput
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder="Poids en kg"
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />
      <TextInput
        value={targetWeightKg}
        onChangeText={setTargetWeightKg}
        keyboardType="numeric"
        placeholder="Poids cible optionnel"
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Activite</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {activityLevels.map((item) => (
            <OptionButton key={item.value} label={item.label} value={item.value} selected={activityLevel === item.value} onSelect={setActivityLevel} />
          ))}
        </View>
      </View>

      {preview ? (
        <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
          Cible estimee: {preview.calorieTarget} kcal, {preview.proteinTargetG} g proteines.
        </Text>
      ) : (
        <Text style={{ color: colors.red, fontSize: typography.small, lineHeight: 18 }}>
          Entre une taille et un poids realistes pour generer tes objectifs.
        </Text>
      )}

      <Pressable
        onPress={save}
        disabled={!canSave}
        style={{
          alignItems: 'center',
          backgroundColor: canSave ? colors.green : colors.line,
          borderRadius: radius.md,
          flexDirection: 'row',
          gap: spacing.sm,
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Save color="white" size={20} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Enregistrer</Text>
      </Pressable>
    </ScrollView>
  );
}
