import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export function StickyFooterButton({ label, onPress, disabled = false, icon, secondaryLabel, onSecondaryPress }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, borderColor: colors.line, borderTopWidth: 1, gap: spacing.md, padding: spacing.xl }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          alignItems: 'center',
          backgroundColor: disabled ? '#8F8F8B' : colors.black,
          borderRadius: radius.pill,
          flexDirection: 'row',
          gap: spacing.md,
          justifyContent: 'center',
          minHeight: 64,
          paddingHorizontal: spacing.xl,
        }}
      >
        <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>{label}</Text>
        {icon}
      </Pressable>
      {secondaryLabel && onSecondaryPress ? (
        <Pressable
          onPress={onSecondaryPress}
          style={{
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.pill,
            borderWidth: 1,
            justifyContent: 'center',
            minHeight: 54,
          }}
        >
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
