import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Num } from '../ui/primitives';
import { colors, fonts, radius, spacing } from '../ui/theme';

export type PaywallPlan = 'annual' | 'monthly';

type Props = {
  plan: PaywallPlan;
  selected: boolean;
  title: string;
  /** Top strip inside the card ("Most popular") — yearly only. */
  banner?: string;
  /** "Save 58%" pill next to the title — hidden in degraded mode. */
  savePill?: string;
  /** Right side: "$4.17 / mo" — or the "Price shown at checkout" placeholder. */
  priceMain: string;
  priceMainIsPlaceholder?: boolean;
  /** Muted mono line under the title: "12 mo · $49.99". */
  priceSub?: string;
  onSelect: (plan: PaywallPlan) => void;
  /** Trial timeline, rendered inside the card under the price row. */
  children?: ReactNode;
};

/**
 * Full-width stacked plan card (Cal AI pattern): visible price, optional
 * "Most popular" banner, save pill, and a check disc top-right when selected.
 */
export function PaywallPlanCard({ plan, selected, title, banner, savePill, priceMain, priceMainIsPlaceholder = false, priceSub, onSelect, children }: Props) {
  return (
    <Pressable
      accessibilityLabel={priceSub ? `${title} — ${priceSub} — ${priceMain}` : `${title} — ${priceMain}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onSelect(plan)}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: selected ? colors.accent : colors.line2,
        borderRadius: radius.md,
        borderWidth: 2,
        opacity: pressed ? 0.88 : 1,
        overflow: 'hidden' as const,
      })}
    >
      {banner ? (
        <View style={{ alignItems: 'center', backgroundColor: selected ? colors.accent : colors.line2, paddingVertical: 5 }}>
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: 10, fontWeight: '500', letterSpacing: 1.4, textTransform: 'uppercase' }}>
            {banner}
          </Text>
        </View>
      ) : null}

      {/* Check disc top-right (under the banner when present) — selection marker. */}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.line2,
          borderRadius: radius.pill,
          borderWidth: 1.5,
          height: 20,
          justifyContent: 'center',
          position: 'absolute',
          right: 10,
          top: banner ? 33 : 10,
          width: 20,
          zIndex: 1,
        }}
      >
        {selected ? <Check color="#FFFFFF" size={12} strokeWidth={3} /> : null}
      </View>

      <View style={{ padding: 14, paddingRight: 38 }}>
        <View style={{ alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ gap: 3 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>{title}</Text>
              {savePill ? (
                <View style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: colors.accentInk, fontFamily: fonts.mono, fontSize: 9, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {savePill}
                  </Text>
                </View>
              ) : null}
            </View>
            {priceSub ? <Num style={{ color: colors.muted, fontSize: 12 }}>{priceSub}</Num> : null}
          </View>
          {priceMainIsPlaceholder ? (
            <Text style={{ color: colors.muted, fontSize: 11, maxWidth: 120, textAlign: 'right' }}>{priceMain}</Text>
          ) : (
            <Num style={{ fontSize: 16, fontWeight: '600' }}>{priceMain}</Num>
          )}
        </View>
        {children}
      </View>
    </Pressable>
  );
}
