import { Pressable, Text, View } from 'react-native';
import { BarChart3, Camera, Check, ShieldCheck } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onStartScan: () => void;
};

export function PremiumUnlockedScreen({ onStartScan }: Props) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
      <View />
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>MACROLENS</Text>
        <View style={{ alignItems: 'center', borderColor: colors.green, borderRadius: radius.pill, borderWidth: 3, height: 118, justifyContent: 'center', width: 118 }}>
          <Check color={colors.green} size={62} strokeWidth={2.5} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', textAlign: 'center' }}>MacroLens Pro is active!</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 23, textAlign: 'center' }}>You now have access to all Pro features.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <Feature icon={Camera} label="Unlimited scans" />
          <Feature icon={BarChart3} label="Advanced insights" />
          <Feature icon={ShieldCheck} label="Sync devices" />
        </View>
      </View>
      <Pressable onPress={onStartScan} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center', width: '100%' }}>
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Start your first scan</Text>
      </Pressable>
    </View>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Camera; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, width: 86 }}>
      <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }}>
        <Icon color={colors.black} size={18} strokeWidth={2.4} />
      </View>
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', lineHeight: 15, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
