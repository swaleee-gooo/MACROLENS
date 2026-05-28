import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowLeft, CalendarDays, Check } from 'lucide-react-native';
import { calculateMacroTargets } from '../domain/macroTargets';
import type { MacroTargets, UserProfile } from '../domain/types';
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

export function WeighInScreen({ profile, userId, onBack, onSave }: Props) {
  const [weight, setWeight] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const weightKg = parseNumber(weight);
  const canSave = weightKg >= 35 && weightKg <= 250;
  const nextProfile = useMemo(() => {
    if (!canSave) {
      return null;
    }

    const baseProfile: UserProfile = {
      id: userId,
      goal: profile?.goal ?? 'maintain',
      ageRange: profile?.ageRange ?? '25-34',
      sex: profile?.sex ?? 'prefer_not_to_say',
      heightCm: profile?.heightCm ?? 175,
      weightKg,
      activityLevel: profile?.activityLevel ?? 'moderate',
      targetWeightKg: profile?.targetWeightKg ?? null,
      targets: profile?.targets ?? emptyTargets,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...baseProfile,
      targets: calculateMacroTargets(baseProfile),
    };
  }, [canSave, profile, userId, weightKg]);

  function save() {
    if (nextProfile) {
      onSave(nextProfile);
    }
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
      <View style={{ gap: spacing.xl }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
          <ArrowLeft color={colors.black} size={24} strokeWidth={2.6} />
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Back</Text>
        </Pressable>
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>MACROLENS</Text>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.md }}>Add weigh-in</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', textAlign: 'center' }}>Keep your goal progress accurate.</Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, padding: spacing.xl }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <CalendarDays color={colors.muted} size={18} strokeWidth={2.5} />
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>{new Date().toISOString().slice(0, 10)}</Text>
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="70.0" placeholderTextColor={colors.muted} style={{ color: colors.black, flex: 1, fontSize: typography.hero, fontWeight: '900', minHeight: 82, textAlign: 'center' }} />
            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, flexDirection: 'row', padding: spacing.xs }}>
              {(['kg', 'lb'] as const).map((value) => (
                <Pressable key={value} onPress={() => setUnit(value)} style={{ alignItems: 'center', backgroundColor: unit === value ? colors.green : 'transparent', borderRadius: radius.pill, minHeight: 34, minWidth: 44, justifyContent: 'center' }}>
                  <Text style={{ color: unit === value ? 'white' : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{value}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', textAlign: 'center' }}>Current target: {profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : 'not set'}</Text>
        </View>
      </View>

      <Pressable disabled={!canSave} onPress={save} style={{ alignItems: 'center', backgroundColor: canSave ? colors.black : colors.line, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, minHeight: 58, justifyContent: 'center' }}>
        <Check color="white" size={20} strokeWidth={2.7} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Save</Text>
      </Pressable>
    </View>
  );
}
