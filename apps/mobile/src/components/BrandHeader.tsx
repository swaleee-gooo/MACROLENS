import { Pressable, Text, View } from 'react-native';
import { Bell, Flame, Settings } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  streak?: number;
  onSettings?: () => void;
};

export function BrandHeader({ streak, onSettings }: Props) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <Flame color={colors.black} size={24} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: 34, fontWeight: '900' }}>MACROLENS</Text>
      </View>
      {onSettings ? (
        <Pressable
          onPress={onSettings}
          style={{
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.pill,
            borderWidth: 1,
            height: 48,
            justifyContent: 'center',
            width: 48,
          }}
        >
          <Settings color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.pill,
            borderWidth: 1,
            height: 48,
            justifyContent: 'center',
            width: 48,
          }}
        >
          {typeof streak === 'number' ? (
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>{streak}</Text>
          ) : (
            <Bell color={colors.ink} size={22} strokeWidth={2.4} />
          )}
        </View>
      )}
    </View>
  );
}
