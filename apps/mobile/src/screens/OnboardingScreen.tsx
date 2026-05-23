import { Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { UserGoal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onComplete: (goal: UserGoal) => void;
};

const goals: { value: UserGoal; label: string; description: string }[] = [
  { value: 'lose_fat', label: 'Perdre du gras', description: 'Priorite aux calories et aux proteines.' },
  { value: 'build_muscle', label: 'Construire du muscle', description: 'Suivre les proteines sans friction.' },
  { value: 'maintain', label: 'Maintenir', description: 'Comprendre tes repas sans obsession.' },
  { value: 'understand_eating', label: 'Mieux manger', description: 'Voir les tendances repas apres repas.' },
];

export function OnboardingScreen({ onComplete }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>MacroLens</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
          Estime tes macros a partir d'une photo. Les resultats sont des estimations, pas des conseils medicaux.
        </Text>
      </View>
      <View style={{ gap: spacing.md }}>
        {goals.map((goal) => (
          <Pressable
            key={goal.value}
            onPress={() => onComplete(goal.value)}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.md,
              borderWidth: 1,
              flexDirection: 'row',
              gap: spacing.md,
              padding: spacing.lg,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{goal.label}</Text>
              <Text style={{ color: colors.muted, fontSize: typography.small, marginTop: spacing.xs }}>{goal.description}</Text>
            </View>
            <ArrowRight color={colors.green} size={20} strokeWidth={2.5} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
