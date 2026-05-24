import { Pressable, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

export type PaywallPlan = 'annual' | 'monthly';

type Props = {
  plan: PaywallPlan;
  selected: boolean;
  title: string;
  price: string;
  detail: string;
  badge?: string;
  onSelect: (plan: PaywallPlan) => void;
};

export function PaywallPlanCard({ plan, selected, title, price, detail, badge, onSelect }: Props) {
  return (
    <Pressable
      onPress={() => onSelect(plan)}
      style={{
        backgroundColor: selected ? colors.black : colors.surface,
        borderColor: selected ? colors.black : colors.line,
        borderRadius: radius.md,
        borderWidth: 2,
        gap: spacing.sm,
        padding: spacing.lg,
      }}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: selected ? 'white' : colors.ink, fontSize: typography.heading, fontWeight: '900' }}>{title}</Text>
        {selected ? <CheckCircle2 color="white" size={22} strokeWidth={2.5} /> : null}
      </View>
      <Text style={{ color: selected ? 'white' : colors.ink, fontSize: typography.title, fontWeight: '900' }}>{price}</Text>
      <Text style={{ color: selected ? '#EDEDED' : colors.muted, fontSize: typography.small, fontWeight: '800' }}>{detail}</Text>
      {badge ? (
        <View style={{ alignSelf: 'flex-start', backgroundColor: selected ? colors.greenSoft : colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
          <Text style={{ color: colors.green, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
