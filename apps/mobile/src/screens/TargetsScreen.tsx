import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Save, Target } from 'lucide-react-native';
import { calculateMacroTargets } from '../domain/macroTargets';
import type { UserProfile } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

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

function Stat({ label, value, color = colors.ink }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, minWidth: 132, padding: spacing.md }}>
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.xs }}>{value}</Text>
    </View>
  );
}

export function TargetsScreen({ profile, onBack, onCreateProfile, onSave }: Props) {
  const [calorieOverride, setCalorieOverride] = useState(profile?.targets.calorieOverride ? String(profile.targets.calorieOverride) : '');
  const [proteinOverride, setProteinOverride] = useState(profile?.targets.proteinOverrideG ? String(profile.targets.proteinOverrideG) : '');

  if (!profile) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'center', padding: spacing.xl }}>
        <Target color={colors.green} size={48} strokeWidth={2} />
        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Objectifs macros</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
            Cree ton profil pour generer des objectifs calories et proteines.
          </Text>
        </View>
        <Pressable onPress={onCreateProfile} style={{ alignItems: 'center', backgroundColor: colors.green, borderRadius: radius.md, padding: spacing.lg }}>
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Creer mon profil</Text>
        </Pressable>
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

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Objectifs</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>Ajuste seulement si tu as deja une cible precise.</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <Stat label="Calories" value={`${nextTargets.calorieTarget} kcal`} color={colors.ink} />
        <Stat label="Proteines" value={`${nextTargets.proteinTargetG} g`} color={colors.protein} />
        <Stat label="Glucides" value={`${nextTargets.carbsTargetG} g`} color={colors.carbs} />
        <Stat label="Lipides" value={`${nextTargets.fatTargetG} g`} color={colors.fat} />
        <Stat label="Fibres" value={`${nextTargets.fiberTargetG} g`} color={colors.fiber} />
      </View>

      <TextInput
        value={calorieOverride}
        onChangeText={setCalorieOverride}
        keyboardType="numeric"
        placeholder="Override calories optionnel"
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />
      <TextInput
        value={proteinOverride}
        onChangeText={setProteinOverride}
        keyboardType="numeric"
        placeholder="Override proteines optionnel"
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />

      <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
        Les objectifs sont des estimations pour guider ton suivi, pas un avis medical.
      </Text>

      <Pressable
        onPress={save}
        style={{ alignItems: 'center', backgroundColor: colors.green, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.lg }}
      >
        <Save color="white" size={20} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Enregistrer</Text>
      </Pressable>
    </ScrollView>
  );
}
