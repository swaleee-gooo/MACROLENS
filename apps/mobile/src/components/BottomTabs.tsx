import { Pressable, Text, View } from 'react-native';
import { BarChart3, CalendarCheck, Camera, Home, User } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

export type AppTab = 'home' | 'today' | 'timeline' | 'profile';

type Props = {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onScanPress: () => void;
};

const tabs: { tab: AppTab; label: string; icon: typeof Home }[] = [
  { tab: 'home', label: 'Accueil', icon: Home },
  { tab: 'today', label: 'Coach', icon: CalendarCheck },
  { tab: 'timeline', label: 'Timeline', icon: BarChart3 },
  { tab: 'profile', label: 'Profil', icon: User },
];

function TabButton({ active, icon: Icon, label, onPress }: { active: boolean; icon: typeof Home; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', flex: 1, gap: spacing.xs, justifyContent: 'center' }}>
      <Icon color={active ? colors.black : colors.muted} size={24} strokeWidth={active ? 2.8 : 2.2} />
      <Text style={{ color: active ? colors.black : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

export function BottomTabs({ activeTab, onChangeTab, onScanPress }: Props) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderTopWidth: 1, flexDirection: 'row', minHeight: 78, paddingBottom: spacing.md, paddingTop: spacing.sm }}>
      {tabs.slice(0, 2).map(({ tab, label, icon }) => (
        <TabButton key={tab} active={activeTab === tab} icon={icon} label={label} onPress={() => onChangeTab(tab)} />
      ))}

      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Pressable
          accessibilityLabel="Scanner"
          onPress={onScanPress}
          style={{
            alignItems: 'center',
            backgroundColor: colors.black,
            borderColor: colors.surface,
            borderRadius: radius.pill,
            borderWidth: 4,
            height: 64,
            justifyContent: 'center',
            marginTop: -26,
            width: 64,
          }}
        >
          <Camera color="white" size={25} strokeWidth={2.6} />
        </Pressable>
      </View>

      {tabs.slice(2).map(({ tab, label, icon }) => (
        <TabButton key={tab} active={activeTab === tab} icon={icon} label={label} onPress={() => onChangeTab(tab)} />
      ))}
    </View>
  );
}
