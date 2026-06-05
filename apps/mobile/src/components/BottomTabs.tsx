import { Pressable, Text, View } from 'react-native';
import { BarChart3, Home, ScanLine, TrendingUp, User } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { colors, fonts } from '../ui/theme';

export type AppTab = 'home' | 'today' | 'timeline' | 'profile';

type Props = {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onScanPress: () => void;
};

const TAB_ICONS: { tab: AppTab; icon: typeof Home }[] = [
  { tab: 'home', icon: Home },
  { tab: 'timeline', icon: BarChart3 },
  { tab: 'today', icon: TrendingUp },
  { tab: 'profile', icon: User },
];

const STR = {
  en: { home: 'Home', timeline: 'History', today: 'Progress', profile: 'Profile' },
  fr: { home: 'Accueil', timeline: 'Historique', today: 'Progrès', profile: 'Profil' },
};

function TabButton({ active, icon: Icon, label, onPress }: { active: boolean; icon: typeof Home; label: string; onPress: () => void }) {
  const color = active ? colors.ink : colors.muted2;

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', flex: 1, gap: 5, height: 74, justifyContent: 'center' }}>
      <Icon color={color} size={22} strokeWidth={active ? 2.4 : 2} />
      <Text style={{ color, fontFamily: fonts.mono, fontSize: 9, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Pressable>
  );
}

export function BottomTabs({ activeTab, onChangeTab, onScanPress }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const tabs = TAB_ICONS.map(({ tab, icon }) => ({ tab, icon, label: t[tab] }));

  return (
    <View style={{ alignSelf: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderTopWidth: 1, height: 80, maxWidth: 430, position: 'relative', width: '100%' }}>
      <View style={{ flexDirection: 'row', height: 74, paddingHorizontal: 8 }}>
        {tabs.slice(0, 2).map(({ tab, label, icon }) => (
          <TabButton key={tab} active={activeTab === tab} icon={icon} label={label} onPress={() => onChangeTab(tab)} />
        ))}
        <View style={{ width: 76 }} />
        {tabs.slice(2).map(({ tab, label, icon }) => (
          <TabButton key={tab} active={activeTab === tab} icon={icon} label={label} onPress={() => onChangeTab(tab)} />
        ))}
      </View>
      <Pressable
        accessibilityLabel="Scan"
        onPress={onScanPress}
        style={{
          alignItems: 'center',
          backgroundColor: colors.ink,
          borderColor: colors.surface,
          borderRadius: 31,
          borderWidth: 4,
          elevation: 7,
          height: 62,
          justifyContent: 'center',
          left: '50%',
          marginLeft: -31,
          position: 'absolute',
          shadowColor: '#142016',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
          top: -22,
          width: 62,
        }}
      >
        <ScanLine color="#FFFFFF" size={25} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}
