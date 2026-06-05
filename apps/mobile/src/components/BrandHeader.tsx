import { Pressable, Text, View } from 'react-native';
import { Flame, Settings } from 'lucide-react-native';
import { Num, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing } from '../ui/theme';

type Props = {
  streak?: number;
  onSettings?: () => void;
};

export function BrandHeader({ streak, onSettings }: Props) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <Seal size={28} color={colors.accent} />
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 23, letterSpacing: -0.4 }}>MacroLens</Text>
      </View>
      {onSettings ? (
        <Pressable
          onPress={onSettings}
          style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 }}
        >
          <Settings color={colors.ink2} size={20} strokeWidth={2} />
        </Pressable>
      ) : typeof streak === 'number' ? (
        <View style={{ alignItems: 'center', borderColor: colors.line2, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7 }}>
          <Flame color={colors.warn} size={15} strokeWidth={2} />
          <Num style={{ fontSize: 13, fontWeight: '600' }}>{streak}</Num>
        </View>
      ) : null}
    </View>
  );
}
