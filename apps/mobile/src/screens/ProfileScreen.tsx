import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { calculateMacroTargets } from '../domain/macroTargets';
import { cmToFtIn, ftInToCm, kgToLbs, lbsToKg, type UnitSystem } from '../domain/units';
import type { MacroTargets, UserGoal, UserProfile } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  profile: UserProfile | null;
  userId: string;
  /** Display unit system; the saved profile stays metric. */
  unitSystem: UnitSystem;
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
  { value: 'lose_fat', label: 'Lose fat' },
  { value: 'build_muscle', label: 'Muscle' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'understand_eating', label: 'Understand' },
];

const ageRanges: UserProfile['ageRange'][] = ['18-24', '25-34', '35-44', '45-54', '55+'];

const activityLevels: { value: UserProfile['activityLevel']; label: string }[] = [
  { value: 'low', label: 'Calm' },
  { value: 'moderate', label: 'Active' },
  { value: 'high', label: 'Athletic' },
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

export function ProfileScreen({ profile, userId, unitSystem, onBack, onSave }: Props) {
  const isImperial = unitSystem === 'imperial';
  const [goal, setGoal] = useState<UserGoal>(profile?.goal ?? 'lose_fat');
  const [ageRange, setAgeRange] = useState<UserProfile['ageRange']>(profile?.ageRange ?? '25-34');
  const [sex, setSex] = useState<UserProfile['sex']>(profile?.sex ?? 'prefer_not_to_say');
  // Field text lives in the DISPLAY unit; parsing below converts back to
  // metric without rounding so the saved profile stays canonical kg/cm.
  const initialFtIn = profile?.heightCm ? cmToFtIn(profile.heightCm) : null;
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [heightFt, setHeightFt] = useState(initialFtIn ? String(initialFtIn.ft) : '');
  const [heightIn, setHeightIn] = useState(initialFtIn ? String(initialFtIn.in) : '');
  const [weightKg, setWeightKg] = useState(profile?.weightKg ? String(isImperial ? kgToLbs(profile.weightKg) : profile.weightKg) : '');
  const [targetWeightKg, setTargetWeightKg] = useState(
    profile?.targetWeightKg ? String(isImperial ? kgToLbs(profile.targetWeightKg) : profile.targetWeightKg) : '',
  );
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(profile?.activityLevel ?? 'moderate');

  const height = isImperial ? ftInToCm(parsePositiveNumber(heightFt), parsePositiveNumber(heightIn)) : parsePositiveNumber(heightCm);
  const weight = isImperial ? lbsToKg(parsePositiveNumber(weightKg)) : parsePositiveNumber(weightKg);
  const parsedTargetWeight = targetWeightKg.trim() ? (isImperial ? lbsToKg(parsePositiveNumber(targetWeightKg)) : parsePositiveNumber(targetWeightKg)) : null;
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
      targetWeightKg: parsedTargetWeight,
      targets: profile?.targets ?? emptyTargets,
      updatedAt: profile?.updatedAt ?? new Date().toISOString(),
    });
  }, [activityLevel, ageRange, canSave, goal, height, parsedTargetWeight, profile?.targets, profile?.updatedAt, sex, userId, weight]);

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
      targetWeightKg: parsedTargetWeight,
      targets: preview,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Back</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Profile</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
          This data is only used to personalize your local targets.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Goal</Text>
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
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Sex</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <OptionButton label="Female" value="female" selected={sex === 'female'} onSelect={setSex} />
          <OptionButton label="Male" value="male" selected={sex === 'male'} onSelect={setSex} />
          <OptionButton label="Neutral" value="prefer_not_to_say" selected={sex === 'prefer_not_to_say'} onSelect={setSex} />
        </View>
      </View>

      {isImperial ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput
            value={heightFt}
            onChangeText={setHeightFt}
            keyboardType="numeric"
            placeholder="Height (ft)"
            placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, flex: 1, padding: spacing.md }}
          />
          <TextInput
            value={heightIn}
            onChangeText={setHeightIn}
            keyboardType="numeric"
            placeholder="(in)"
            placeholderTextColor={colors.muted}
            style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, flex: 1, padding: spacing.md }}
          />
        </View>
      ) : (
        <TextInput
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="numeric"
          placeholder="Height in cm"
          placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
        />
      )}
      <TextInput
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder={isImperial ? 'Weight in lbs' : 'Weight in kg'}
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />
      <TextInput
        value={targetWeightKg}
        onChangeText={setTargetWeightKg}
        keyboardType="numeric"
        placeholder={isImperial ? 'Optional target weight (lbs)' : 'Optional target weight'}
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Activity</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {activityLevels.map((item) => (
            <OptionButton key={item.value} label={item.label} value={item.value} selected={activityLevel === item.value} onSelect={setActivityLevel} />
          ))}
        </View>
      </View>

      {preview ? (
        <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
          Estimated target: {preview.calorieTarget} kcal, {preview.proteinTargetG} g protein.
        </Text>
      ) : (
        <Text style={{ color: colors.red, fontSize: typography.small, lineHeight: 18 }}>
          Enter a realistic height and weight to generate your targets.
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
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}
