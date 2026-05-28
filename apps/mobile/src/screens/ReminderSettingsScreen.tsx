import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
};

type ReminderState = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  water: boolean;
};

const key = 'macrolens.reminders.v1';
const defaults: ReminderState = { breakfast: true, lunch: true, dinner: true, water: false };

function ReminderRow({ label, detail, value, onValueChange }: { label: string; detail: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
      <Bell color={value ? colors.green : colors.muted} size={19} strokeWidth={2.4} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{detail}</Text>
      </View>
      <Switch onValueChange={onValueChange} value={value} trackColor={{ false: colors.line, true: colors.greenSoft }} thumbColor={value ? colors.green : colors.surfaceMuted} />
    </View>
  );
}

export function ReminderSettingsScreen({ onBack }: Props) {
  const [state, setState] = useState<ReminderState>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) {
          setState({ ...defaults, ...(JSON.parse(raw) as Partial<ReminderState>) });
        }
      })
      .catch(() => undefined);
  }, []);

  async function update(next: ReminderState) {
    setState(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Rappels</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Reglages persistants pour les rappels repas. Les notifications push seront activees dans la prochaine build native.</Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <ReminderRow detail="08:00" label="Petit-dejeuner" value={state.breakfast} onValueChange={(value) => update({ ...state, breakfast: value })} />
        <ReminderRow detail="12:30" label="Dejeuner" value={state.lunch} onValueChange={(value) => update({ ...state, lunch: value })} />
        <ReminderRow detail="19:30" label="Diner" value={state.dinner} onValueChange={(value) => update({ ...state, dinner: value })} />
        <ReminderRow detail="Toutes les 2 heures" label="Eau" value={state.water} onValueChange={(value) => update({ ...state, water: value })} />
      </View>
    </ScrollView>
  );
}
