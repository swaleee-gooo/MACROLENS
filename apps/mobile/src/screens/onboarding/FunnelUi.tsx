/**
 * Shared "Clinical Trust" funnel chrome (W3) — the React Native port of the
 * prototype's funnelStep() template: back chevron + progress track + "NN / 12"
 * mono counter, kicker eyebrow, display title, option rows with radio/checkbox
 * semantics, numeric fields, and the target-weight stepper.
 */
import type { ComponentType, ReactNode } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Check, ChevronLeft, Minus, Plus } from 'lucide-react-native';
import { Eyebrow, Num } from '../../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../../ui/theme';

type IconComponent = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

/** Top bar: back chevron + thin progress track + "NN / 12" counter (counter optional for perms). */
export function FunnelHeader({
  counter,
  onBack,
  backLabel,
  centerEyebrow,
}: {
  counter: { index: number; total: number; progressPct: number } | null;
  onBack: () => void;
  backLabel: string;
  centerEyebrow?: string;
}) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
      <Pressable
        accessibilityLabel={backLabel}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => ({ alignItems: 'center', height: 32, justifyContent: 'center', marginLeft: -6, opacity: pressed ? 0.6 : 1, width: 32 })}
      >
        <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
      </Pressable>

      {counter ? (
        <>
          <View style={{ backgroundColor: colors.paper3, borderRadius: radius.pill, flex: 1, height: 4, overflow: 'hidden' }}>
            <View style={{ backgroundColor: colors.ink, borderRadius: radius.pill, height: 4, width: `${counter.progressPct}%` }} />
          </View>
          <Num style={{ color: colors.muted, fontSize: 11 }}>
            {String(counter.index).padStart(2, '0')} / {String(counter.total).padStart(2, '0')}
          </Num>
        </>
      ) : (
        <>
          <View style={{ alignItems: 'center', flex: 1 }}>{centerEyebrow ? <Eyebrow>{centerEyebrow}</Eyebrow> : null}</View>
          <View style={{ width: 32 }} />
        </>
      )}
    </View>
  );
}

/** Kicker eyebrow + display title + optional sub, left-aligned per the funnelStep template. */
export function FunnelTitle({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 27, fontWeight: '600', letterSpacing: -0.7, lineHeight: 31 }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19, marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
  );
}

/**
 * Prototype `.opt` row — single- or multi-select. Selected state: ink border +
 * 3px emerald inset strip + accent check. Radio/checkbox semantics for VoiceOver.
 */
export function FunnelOption({
  label,
  detail,
  meta,
  badge,
  icon: Icon,
  selected,
  multi = false,
  onPress,
}: {
  label: string;
  detail?: string;
  /** Right-aligned mono meta, e.g. "0.5 lb/week" or "4-6/wk". */
  meta?: string;
  /** Small accent chip after the label, e.g. "Recommended". */
  badge?: string;
  icon?: IconComponent;
  selected: boolean;
  multi?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.ink : colors.line2,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 56,
        opacity: pressed ? 0.85 : 1,
        overflow: 'hidden',
        paddingHorizontal: 15,
        paddingVertical: 13,
      })}
    >
      {/* Emerald inset strip on selection (prototype: inset 3px 0 0 var(--accent)) */}
      <View style={{ backgroundColor: selected ? colors.accent : 'transparent', bottom: 0, left: 0, position: 'absolute', top: 0, width: 3 }} />

      {Icon ? (
        <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
          <Icon color={colors.ink2} size={19} strokeWidth={1.9} />
        </View>
      ) : null}

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontSize: 14.5, fontWeight: '600' }}>{label}</Text>
          {badge ? (
            <View style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 7, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: colors.accentInk, fontFamily: fonts.mono, fontSize: 9, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {detail ? <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 15 }}>{detail}</Text> : null}
      </View>

      {meta ? <Num style={{ color: colors.muted, fontSize: typography.tiny }}>{meta}</Num> : null}
      <Check color={selected ? colors.accent : colors.line2} size={18} strokeWidth={2.4} />
    </Pressable>
  );
}

/** Labeled numeric field (`.fld`): eyebrow label + bold value + mono unit. */
export function FunnelField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  unit?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line2,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: 'row',
          paddingHorizontal: spacing.lg,
        }}
      >
        <TextInput
          accessibilityLabel={label ?? placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.muted2}
          style={{ color: colors.ink, flex: 1, fontSize: typography.heading, fontWeight: '700', minHeight: 58, minWidth: 0 }}
        />
        {unit ? <Num style={{ color: colors.muted, fontSize: typography.small }}>{unit}</Num> : null}
      </View>
    </View>
  );
}

/** Prototype `.stepper`: minus / mono value + unit / plus. Value lives in the display unit. */
export function FunnelStepper({
  valueLabel,
  unit,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  valueLabel: string;
  unit: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const buttonStyle = ({ pressed }: { pressed: boolean }) => ({
    alignItems: 'center' as const,
    backgroundColor: pressed ? colors.paper3 : colors.paper2,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: 'center' as const,
    width: 44,
  });

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line2,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 6,
      }}
    >
      <Pressable accessibilityLabel={decreaseLabel} accessibilityRole="button" onPress={onDecrease} style={buttonStyle}>
        <Minus color={colors.ink} size={18} strokeWidth={2.2} />
      </Pressable>
      <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 6 }}>
        <Num style={{ fontSize: 22, fontWeight: '600' }}>{valueLabel}</Num>
        <Text style={{ color: colors.muted, fontSize: typography.small }}>{unit}</Text>
      </View>
      <Pressable accessibilityLabel={increaseLabel} accessibilityRole="button" onPress={onIncrease} style={buttonStyle}>
        <Plus color={colors.ink} size={18} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

/** Settings-style row with a trailing switch (perms step) — same pattern as HealthSettingsScreen. */
export function FunnelToggleRow({
  icon,
  label,
  value,
  onValueChange,
  isLast = false,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: colors.line,
        borderBottomWidth: isLast ? 0 : 1,
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 13,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.sm, height: 32, justifyContent: 'center', width: 32 }}>{icon}</View>
      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '500' }}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line2, true: colors.accent }}
        thumbColor={colors.surface}
      />
    </View>
  );
}
