import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { StickyFooterButton } from '../components/StickyFooterButton';
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

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function BoxInput({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.sm }}>
      <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.black, fontSize: typography.subheading, fontWeight: '900', minHeight: 66, padding: spacing.lg }}
      />
    </View>
  );
}

export function EditProfileScreen({ profile, userId, onBack, onSave }: Props) {
  const [goal, setGoal] = useState<UserGoal>(profile?.goal ?? 'maintain');
  const [weight, setWeight] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [targetWeight, setTargetWeight] = useState(profile?.targetWeightKg ? String(profile.targetWeightKg) : '');
  const [height, setHeight] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [sex, setSex] = useState<UserProfile['sex']>(profile?.sex ?? 'female');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(profile?.activityLevel ?? 'moderate');
  const weightKg = parseNumber(weight);
  const targetWeightKg = targetWeight.trim().length > 0 ? parseNumber(targetWeight) : null;
  const heightCm = parseNumber(height);
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
      <ScrollView contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <ArrowLeft color={colors.black} size={28} strokeWidth={2.6} />
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>MACROLENS</Text>
        </Pressable>
        <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>Modifier le profil</Text>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Objectif principal</Text>
          <Pressable onPress={() => setGoal(goal === 'maintain' ? 'lose_fat' : 'maintain')} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 66, padding: spacing.lg }}>
            <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{goal === 'maintain' ? 'Maintien' : 'Perdre du poids'}</Text>
            <ChevronDown color={colors.muted} size={22} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <BoxInput label="Poids actuel (kg)" value={weight} onChangeText={setWeight} placeholder="72.5" />
          <BoxInput label="Poids cible (kg)" value={targetWeight} onChangeText={setTargetWeight} placeholder="62.0" />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <BoxInput label="Taille (cm)" value={height} onChangeText={setHeight} placeholder="178" />
          <BoxInput label="Age" value={profile?.ageRange === '18-24' ? '22' : '28'} onChangeText={() => undefined} placeholder="28" />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Sexe</Text>
          <Pressable onPress={() => setSex(sex === 'female' ? 'male' : 'female')} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 66, padding: spacing.lg }}>
            <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{sex === 'female' ? 'Femme' : 'Homme'}</Text>
            <ChevronDown color={colors.muted} size={22} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Niveau d'activite</Text>
          <Pressable onPress={() => setActivityLevel(activityLevel === 'moderate' ? 'high' : 'moderate')} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 66, padding: spacing.lg }}>
            <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{activityLevel === 'high' ? 'Intense' : 'Actif (3-5 fois/semaine)'}</Text>
            <ChevronDown color={colors.muted} size={22} strokeWidth={2.4} />
          </Pressable>
        </View>
      </ScrollView>
      <StickyFooterButton label="Enregistrer les modifications" onPress={save} disabled={!canSave} />
    </View>
  );
}
