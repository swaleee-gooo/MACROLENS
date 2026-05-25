import { Pressable, Text, View } from 'react-native';
import { BarChart3, CalendarCheck, Home, User } from 'lucide-react-native';
import { colors, spacing, typography } from '../ui/theme';

export type AppTab = 'home' | 'today' | 'timeline' | 'profile';

type Props = {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
};

const tabs: { tab: AppTab; label: string; icon: typeof Home }[] = [
  { tab: 'home', label: 'Accueil', icon: Home },
  { tab: 'today', label: 'Coach', icon: CalendarCheck },
  { tab: 'timeline', label: 'Timeline', icon: BarChart3 },
  { tab: 'profile', label: 'Profil', icon: User },
];

export function BottomTabs({ activeTab, onChangeTab }: Props) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderTopWidth: 1, flexDirection: 'row', paddingBottom: spacing.md, paddingTop: spacing.md }}>
      {tabs.map(({ tab, label, icon: Icon }) => {
        const active = activeTab === tab;

        return (
          <Pressable key={tab} onPress={() => onChangeTab(tab)} style={{ alignItems: 'center', flex: 1, gap: spacing.xs }}>
            <Icon color={active ? colors.black : colors.muted} size={24} strokeWidth={active ? 2.8 : 2.2} />
            <Text style={{ color: active ? colors.black : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
