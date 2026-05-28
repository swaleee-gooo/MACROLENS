import { Pressable, Text, View } from 'react-native';
import { Barcode, Camera, ImagePlus, Keyboard, ScanText } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';
import type { ScannerMode } from '../scanner/scannerModes';

type Props = {
  onBack: () => void;
  onOpenScanner: (mode: ScannerMode) => void;
  onOpenLibrary: () => void;
  onOpenFoodSearch: () => void;
  onOpenManualMeal: () => void;
};

function ScanChoice({
  title,
  icon: Icon,
  selected = false,
  onPress,
}: {
  title: string;
  icon: typeof Camera;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.green : colors.line,
        borderRadius: radius.lg,
        borderWidth: selected ? 2 : 1,
        flexBasis: '47%',
        gap: spacing.md,
        minHeight: 118,
        justifyContent: 'center',
        padding: spacing.lg,
      }}
    >
      <Icon color={selected ? colors.green : colors.black} size={28} strokeWidth={2.5} />
      <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function ScanHubScreen({ onBack, onOpenScanner, onOpenLibrary, onOpenFoodSearch, onOpenManualMeal }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, flex: 1, padding: spacing.xl }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', height: 42, justifyContent: 'center', width: 42 }}>
          <Text style={{ color: colors.black, fontSize: 30, fontWeight: '500' }}>‹</Text>
        </Pressable>
        <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>MACROLENS</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxxl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', textAlign: 'center' }}>What would you like to log?</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19, textAlign: 'center' }}>Photo, produit, etiquette ou saisie rapide.</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between', marginTop: spacing.xxl }}>
        <ScanChoice icon={Camera} selected title="Meal Photo" onPress={() => onOpenScanner('meal')} />
        <ScanChoice icon={Barcode} title="Barcode" onPress={() => onOpenScanner('barcode')} />
        <ScanChoice icon={ScanText} title="Nutrition Label" onPress={() => onOpenScanner('label')} />
        <ScanChoice icon={ImagePlus} title="Gallery" onPress={onOpenLibrary} />
      </View>

      <Pressable
        onPress={onOpenFoodSearch}
        style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.md, minHeight: 52 }}
      >
        <Keyboard color={colors.black} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>Search food database</Text>
      </Pressable>

      <Pressable
        onPress={onOpenManualMeal}
        style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 58 }}
      >
        <Keyboard color="white" size={18} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Manual add</Text>
      </Pressable>
    </View>
  );
}
