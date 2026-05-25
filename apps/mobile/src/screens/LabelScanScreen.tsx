import { Alert, Platform, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, ScanText } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
  onLabelPhoto: (imageUri: string) => void;
};

export function LabelScanScreen({ onBack, onLabelPhoto }: Props) {
  async function captureLabel() {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera indisponible', 'Autorise la camera ou ajoute le produit manuellement.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    onLabelPhoto(result.assets[0].uri);
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'space-between', padding: spacing.xl }}>
      <View style={{ gap: spacing.xl }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs }}>
          <ArrowLeft color={colors.black} size={26} strokeWidth={2.6} />
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
        </Pressable>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Lecture etiquette</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Cadre le tableau nutritionnel de face. MacroLens lit les valeurs par 100 g et cree le produit automatiquement.</Text>
        </View>
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, minHeight: 260, justifyContent: 'center', padding: spacing.xl }}>
          <ScanText color={colors.green} size={64} strokeWidth={2.1} />
          <Text style={{ color: colors.ink, fontSize: typography.subheading, fontWeight: '900', textAlign: 'center' }}>Calories, proteines, glucides, lipides</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19, textAlign: 'center' }}>Ideal si le code-barres est absent ou si la base produit est incomplete.</Text>
        </View>
      </View>
      <Pressable onPress={captureLabel} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, minHeight: 64, justifyContent: 'center' }}>
        <Camera color="white" size={22} strokeWidth={2.6} />
        <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>Prendre la photo</Text>
      </Pressable>
    </View>
  );
}
