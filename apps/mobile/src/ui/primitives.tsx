import type { ReactNode } from 'react';
import { Pressable, type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts, radius } from './theme';

/** Circular progress ring with centered content. */
export function Ring({
  progress,
  size = 116,
  stroke = 9,
  color = colors.ink,
  track = colors.paper3,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

/** Mono uppercase micro-label — the "Clinical Trust" eyebrow. */
export function Eyebrow({ children, color = colors.muted, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{ color, fontFamily: fonts.mono, fontSize: 10, fontWeight: '500', letterSpacing: 1.4, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

/** Tabular monospace number — used for every metric in the app. */
export function Num({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: colors.ink, fontFamily: fonts.mono, fontVariant: ['tabular-nums'] }, style]}>
      {children}
    </Text>
  );
}

/** Bordered surface card (hairline, minimal shadow). */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1 }, style]}>{children}</View>;
}

/** MetaboProof seal — shield + check. The brand signature mark. */
export function Seal({ size = 22, color = colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.5 19 5v6c0 4.8-3.3 8.1-7 10-3.7-1.9-7-5.2-7-10V5l7-2.5Z" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
      <Path d="m8.7 11.8 2.3 2.3 4.4-4.6" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Verified (emerald) / Estimated (amber) proof chip. */
export function ProofChip({ level, label, style }: { level: 'verified' | 'estimated'; label?: string; style?: StyleProp<ViewStyle> }) {
  const verified = level === 'verified';
  const fg = verified ? colors.accentInk : colors.warnInk;
  const bg = verified ? colors.accentWash : colors.warnWash;
  const bd = verified ? colors.accentLine : colors.warnLine;
  const text = label ?? (verified ? 'Verified' : 'Estimated');
  return (
    <View style={[{ alignItems: 'center', backgroundColor: bg, borderColor: bd, borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 5 }, style]}>
      {verified ? <Seal size={12} color={fg} /> : <Text style={{ color: fg, fontFamily: fonts.mono, fontSize: 11 }}>◇</Text>}
      <Text style={{ color: fg, fontFamily: fonts.mono, fontSize: 10, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>{text}</Text>
    </View>
  );
}

/** Tri-segment macro bar. */
export function MacroBar({ segments, height = 8, style }: { segments: { pct: number; color: string }[]; height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.paper3, borderRadius: radius.pill, flexDirection: 'row', gap: 2, height, overflow: 'hidden' }, style]}>
      {segments.map((segment, index) => (
        <View key={index} style={{ backgroundColor: segment.color, height: '100%', width: `${Math.max(0, Math.min(100, segment.pct))}%` }} />
      ))}
    </View>
  );
}

/** Signature kcal margin readout: low ┝━◆━┥ high. */
export function ToleranceBar({ low, high, style }: { low: number | string; high: number | string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ alignItems: 'center', flexDirection: 'row', gap: 9 }, style]}>
      <Num style={{ color: colors.muted, fontSize: 11 }}>{low}</Num>
      <View style={{ flex: 1, height: 14, justifyContent: 'center' }}>
        <View style={{ backgroundColor: colors.line2, height: 1, left: 0, position: 'absolute', right: 0 }} />
        <View style={{ backgroundColor: colors.line2, height: 9, left: 0, position: 'absolute', top: 2.5, width: 1.5 }} />
        <View style={{ backgroundColor: colors.line2, height: 9, position: 'absolute', right: 0, top: 2.5, width: 1.5 }} />
        <View style={{ backgroundColor: colors.accent, height: 2, left: '26%', position: 'absolute', right: '26%' }} />
        <View style={{ backgroundColor: colors.accent, height: 7, left: '50%', marginLeft: -3.5, position: 'absolute', top: 3.5, transform: [{ rotate: '45deg' }], width: 7 }} />
      </View>
      <Num style={{ color: colors.muted, fontSize: 11 }}>{high}</Num>
    </View>
  );
}

/** Tinted tile for food / category icons. */
export function FoodTile({ icon, bg = colors.paper2, size = 44, style }: { icon: ReactNode; bg?: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ alignItems: 'center', backgroundColor: bg, borderRadius: 12, height: size, justifyContent: 'center', width: size }, style]}>{icon}</View>;
}

/** Primary action button (dark / accent / ghost). */
export function PrimaryButton({
  label,
  onPress,
  variant = 'dark',
  icon,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'dark' | 'accent' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const bg = variant === 'accent' ? colors.accent : variant === 'ghost' ? colors.paper2 : colors.ink;
  const fg = variant === 'ghost' ? colors.ink : '#FFFFFF';
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled === true }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? colors.line2 : 'transparent',
          borderRadius: radius.md,
          borderWidth: variant === 'ghost' ? 1 : 0,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          paddingVertical: 16,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
