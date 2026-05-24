import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type ManualMealInput = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type Props = {
  onBack: () => void;
  onSave: (input: ManualMealInput) => void;
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function MacroInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
      />
    </View>
  );
}

export function ManualMealScreen({ onBack, onSave }: Props) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [fiberG, setFiberG] = useState('');
  const canSave = name.trim().length > 0 && parseNumber(calories) > 0;

  function save() {
    if (!canSave) {
      return;
    }

    onSave({
      name: name.trim(),
      calories: parseNumber(calories),
      proteinG: parseNumber(proteinG),
      carbsG: parseNumber(carbsG),
      fatG: parseNumber(fatG),
      fiberG: parseNumber(fiberG),
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Repas manuel</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
          Ajoute un repas connu sans passer par la photo.
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>Nom du repas</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: Poke bowl saumon"
          placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, padding: spacing.md }}
        />
      </View>

      <MacroInput label="Calories" value={calories} onChangeText={setCalories} placeholder="927" />
      <MacroInput label="Proteines (g)" value={proteinG} onChangeText={setProteinG} placeholder="38.6" />
      <MacroInput label="Glucides (g)" value={carbsG} onChangeText={setCarbsG} placeholder="90" />
      <MacroInput label="Lipides (g)" value={fatG} onChangeText={setFatG} placeholder="35" />
      <MacroInput label="Fibres (g)" value={fiberG} onChangeText={setFiberG} placeholder="8" />

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
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Creer le repas</Text>
      </Pressable>
    </ScrollView>
  );
}
