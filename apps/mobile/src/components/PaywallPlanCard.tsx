import { Pressable, Text, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { Eyebrow, Num } from '../ui/primitives';
import { colors, radius, spacing } from '../ui/theme';

export type PaywallPlan = 'annual' | 'monthly';

type Props = {
  plan: PaywallPlan;
  selected: boolean;
  title: string;
  price: string;
  priceIsPlaceholder?: boolean;
  detail: string;
  badge?: string;
  onSelect: (plan: PaywallPlan) => void;
};

/** Compact "Clinical Trust" plan row (prototype `.opt`): hairline border, inset accent bar when selected. */
export function PaywallPlanCard({ plan, selected, title, price, priceIsPlaceholder = false, detail, badge, onSelect }: Props) {
  return (
    <Pressable
      accessibilityLabel={`${title} — ${price}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onSelect(plan)}
      style={({ pressed }) => ({
        alignItems: 'center' as const,
        backgroundColor: colors.surface,
        borderColor: selected ? colors.ink : colors.line2,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row' as const,
        gap: spacing.md,
        opacity: pressed ? 0.85 : 1,
        overflow: 'hidden' as const,
        padding: 15,
      })}
    >
      {selected ? <View style={{ backgroundColor: colors.accent, bottom: 0, left: 0, position: 'absolute', top: 0, width: 3 }} /> : null}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontSize: 14.5, fontWeight: '600' }}>{title}</Text>
          {badge ? <Eyebrow color={colors.accentInk} style={{ fontSize: 9 }}>{badge}</Eyebrow> : null}
        </View>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 15 }}>{detail}</Text>
      </View>
      {priceIsPlaceholder ? (
        <Text style={{ color: colors.muted, fontSize: 11, maxWidth: 110, textAlign: 'right' }}>{price}</Text>
      ) : (
        <Num style={{ fontSize: 14, fontWeight: '600' }}>{price}</Num>
      )}
      {selected ? <CheckCircle2 color={colors.accent} size={18} strokeWidth={2.2} /> : <Circle color={colors.line2} size={18} strokeWidth={2} />}
    </Pressable>
  );
}
