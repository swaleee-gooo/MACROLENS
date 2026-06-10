import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { calculateMacroTargets } from '../domain/macroTargets';
import { cmToFtIn, ftInToCm, kgToLbs, lbsToKg, type UnitSystem } from '../domain/units';
import type { MacroTargets, UserGoal, UserProfile } from '../domain/types';
import { useLang } from '../i18n/LanguageContext';
import { Eyebrow } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    title: 'Edit profile',
    goal: 'Goal',
    goalLose: 'Loss',
    goalGain: 'Muscle',
    goalMaintain: 'Maintain',
    sex: 'Sex',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    currentWeightKg: 'Weight (kg)',
    currentWeightLbs: 'Weight (lbs)',
    targetWeightKg: 'Target (kg)',
    targetWeightLbs: 'Target (lbs)',
    heightCm: 'Height (cm)',
    heightFt: 'Height (ft)',
    heightIn: '(in)',
    age: 'Age',
    activityLevel: 'Activity level',
    intense: 'Intense',
    active: 'Active (3-5x/week)',
    saveChanges: 'Save changes',
  },
  fr: {
    title: 'Modifier le profil',
    goal: 'Objectif',
    goalLose: 'Perte',
    goalGain: 'Muscle',
    goalMaintain: 'Maintien',
    sex: 'Sexe',
    male: 'Homme',
    female: 'Femme',
    other: 'Autre',
    currentWeightKg: 'Poids (kg)',
    currentWeightLbs: 'Poids (lbs)',
    targetWeightKg: 'Cible (kg)',
    targetWeightLbs: 'Cible (lbs)',
    heightCm: 'Taille (cm)',
    heightFt: 'Taille (ft)',
    heightIn: '(in)',
    age: 'Âge',
    activityLevel: "Niveau d'activité",
    intense: 'Intensif',
    active: 'Actif (3-5x/semaine)',
    saveChanges: 'Enregistrer',
  },
};

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

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Eyebrow>{label}</Eyebrow>
      <View style={{ backgroundColor: colors.paper2, borderColor: colors.line2, borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 2, padding: 3 }}>
        {options.map((opt) => {
          const on = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={{ alignItems: 'center', backgroundColor: on ? colors.surface : 'transparent', borderRadius: 8, flex: 1, paddingVertical: 9 }}
            >
              <Text style={{ color: on ? colors.ink : colors.muted, fontSize: 10.5, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FieldInput({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.sm }}>
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
          fontSize: typography.subheading,
          fontWeight: '700',
          minHeight: 60,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      />
    </View>
  );
}

function SelectRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Eyebrow>{label}</Eyebrow>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          minHeight: 60,
          opacity: pressed ? 0.7 : 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        })}
      >
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{value}</Text>
        <ChevronDown color={colors.muted} size={20} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

export function EditProfileScreen({ profile, userId, unitSystem, onBack, onSave }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isImperial = unitSystem === 'imperial';
  const [goal, setGoal] = useState<UserGoal>(profile?.goal ?? 'maintain');
  // Field text lives in the DISPLAY unit; parsing below converts back to
  // metric without rounding so the saved profile stays canonical kg/cm.
  const [weight, setWeight] = useState(profile?.weightKg ? String(isImperial ? kgToLbs(profile.weightKg) : profile.weightKg) : '');
  const [targetWeight, setTargetWeight] = useState(
    profile?.targetWeightKg ? String(isImperial ? kgToLbs(profile.targetWeightKg) : profile.targetWeightKg) : '',
  );
  const initialFtIn = profile?.heightCm ? cmToFtIn(profile.heightCm) : null;
  const [height, setHeight] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [heightFt, setHeightFt] = useState(initialFtIn ? String(initialFtIn.ft) : '');
  const [heightIn, setHeightIn] = useState(initialFtIn ? String(initialFtIn.in) : '');
  const [sex, setSex] = useState<UserProfile['sex']>(profile?.sex ?? 'female');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(profile?.activityLevel ?? 'moderate');
  const weightKg = isImperial ? lbsToKg(parseNumber(weight)) : parseNumber(weight);
  const targetWeightKg = targetWeight.trim().length > 0 ? (isImperial ? lbsToKg(parseNumber(targetWeight)) : parseNumber(targetWeight)) : null;
  const heightCm = isImperial ? ftInToCm(parseNumber(heightFt), parseNumber(heightIn)) : parseNumber(height);
  const canSave = weightKg >= 35 && weightKg <= 250 && heightCm >= 120 && heightCm <= 230 && (targetWeightKg === null || (targetWeightKg >= 35 && targetWeightKg <= 250));
  const nextTargets = useMemo(() => {
    if (!canSave) {
      return null;
    }

    return calculateMacroTargets({
      id: userId,
      goal,
      ageRange: profile?.ageRange ?? '25-34',
      sex,
      heightCm,
      weightKg,
      activityLevel,
      targetWeightKg,
      targets: profile?.targets ?? emptyTargets,
      updatedAt: profile?.updatedAt ?? new Date().toISOString(),
    });
  }, [activityLevel, canSave, goal, heightCm, profile, sex, targetWeightKg, userId, weightKg]);

  function save() {
    if (!canSave || !nextTargets) {
      return;
    }

    onSave({
      id: userId,
      goal,
      ageRange: profile?.ageRange ?? '25-34',
      sex,
      heightCm,
      weightKg,
      activityLevel,
      targetWeightKg,
      targets: nextTargets,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>

        {/* Push header: back chevron + centered title */}
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
          <Pressable onPress={onBack} style={({ pressed }) => ({ alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: -6, opacity: pressed ? 0.7 : 1, width: 30 })}>
            <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
          </Pressable>
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600', letterSpacing: -0.1 }}>{t.title}</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Goal segmented control */}
        <SegmentedControl
          label={t.goal}
          options={[
            { key: 'lose_fat' as UserGoal, label: t.goalLose },
            { key: 'build_muscle' as UserGoal, label: t.goalGain },
            { key: 'maintain' as UserGoal, label: t.goalMaintain },
          ]}
          value={goal}
          onChange={setGoal}
        />

        {/* Sex segmented control */}
        <SegmentedControl
          label={t.sex}
          options={[
            { key: 'male' as UserProfile['sex'], label: t.male },
            { key: 'female' as UserProfile['sex'], label: t.female },
            { key: 'prefer_not_to_say' as UserProfile['sex'], label: t.other },
          ]}
          value={sex}
          onChange={setSex}
        />

        {/* 2×2 field grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
          <View style={{ flex: 1, minWidth: 120 }}>
            <FieldInput label={t.age} value={profile?.ageRange === '18-24' ? '22' : '28'} onChangeText={() => undefined} placeholder="28" />
          </View>
          {isImperial ? (
            <View style={{ flex: 1, flexDirection: 'row', gap: 11, minWidth: 120 }}>
              <FieldInput label={t.heightFt} value={heightFt} onChangeText={setHeightFt} placeholder="5" />
              <FieldInput label={t.heightIn} value={heightIn} onChangeText={setHeightIn} placeholder="10" />
            </View>
          ) : (
            <View style={{ flex: 1, minWidth: 120 }}>
              <FieldInput label={t.heightCm} value={height} onChangeText={setHeight} placeholder="178" />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 120 }}>
            <FieldInput
              label={isImperial ? t.currentWeightLbs : t.currentWeightKg}
              value={weight}
              onChangeText={setWeight}
              placeholder={isImperial ? '160.0' : '72.5'}
            />
          </View>
          <View style={{ flex: 1, minWidth: 120 }}>
            <FieldInput
              label={isImperial ? t.targetWeightLbs : t.targetWeightKg}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder={isImperial ? '137.0' : '62.0'}
            />
          </View>
        </View>

        {/* Activity level picker */}
        <SelectRow
          label={t.activityLevel}
          value={activityLevel === 'high' ? t.intense : t.active}
          onPress={() => setActivityLevel(activityLevel === 'moderate' ? 'high' : 'moderate')}
        />
      </ScrollView>
      <StickyFooterButton label={t.saveChanges} onPress={save} disabled={!canSave} />
    </View>
  );
}
