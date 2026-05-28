import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, Leaf, Lightbulb, Pencil } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type ScanErrorVariant = 'non_food' | 'low_light' | 'label';

type Props = {
  variant: ScanErrorVariant;
  onRetake: () => void;
  onManual: () => void;
  onHome: () => void;
};

function contentForVariant(variant: ScanErrorVariant) {
  if (variant === 'label') {
    return {
      icon: AlertTriangle,
      title: "Couldn't read label",
      detail: 'Le tableau nutritionnel est flou, coupe ou incomplet.',
      tips: ['Cadre toute l etiquette', 'Garde le telephone bien droit', 'Montre les valeurs par 100 g'],
    };
  }

  if (variant === 'low_light') {
    return {
      icon: Lightbulb,
      title: 'Low light detected',
      detail: "La photo manque de lumiere pour estimer les portions avec confiance.",
      tips: ['Utilise une lumiere naturelle', 'Evite les ombres fortes', 'Reprends la photo de plus haut'],
    };
  }

  return {
    icon: Leaf,
    title: 'No meal detected',
    detail: "Nous n'avons pas trouve de nourriture exploitable dans cette photo.",
    tips: ['Cadre le plat complet', 'Evite les objets seuls', 'Ajoute manuellement si besoin'],
  };
}

export function ScanErrorScreen({ variant, onRetake, onManual, onHome }: Props) {
  const content = contentForVariant(variant);
  const Icon = content.icon;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
      <View />
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <View style={{ alignItems: 'center', backgroundColor: variant === 'non_food' ? colors.surfaceMuted : colors.amberSoft, borderRadius: radius.pill, height: 96, justifyContent: 'center', width: 96 }}>
          <Icon color={variant === 'non_food' ? colors.muted : colors.amber} size={44} strokeWidth={2.3} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', textAlign: 'center' }}>{content.title}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 23, textAlign: 'center' }}>{content.detail}</Text>
        </View>
        <View style={{ alignSelf: 'stretch', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg }}>
          <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>Tips</Text>
          {content.tips.map((tip) => (
            <Text key={tip} style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>- {tip}</Text>
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        <Pressable onPress={onRetake} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Retake</Text>
        </Pressable>
        <Pressable onPress={onManual} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 54, justifyContent: 'center' }}>
          <Pencil color={colors.black} size={18} strokeWidth={2.5} />
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Add manually</Text>
        </Pressable>
        <Pressable onPress={onHome} style={{ alignItems: 'center', minHeight: 42, justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>Go home</Text>
        </Pressable>
      </View>
    </View>
  );
}
