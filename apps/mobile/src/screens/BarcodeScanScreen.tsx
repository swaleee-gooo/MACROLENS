import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ArrowLeft, Keyboard, ScanBarcode } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onOpenLabelScan: () => void;
  onManualFallback: () => void;
};

export function BarcodeScanScreen({ onBack, onBarcodeDetected, onOpenLabelScan, onManualFallback }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned || !result.data) {
      return;
    }

    setScanned(true);
    onBarcodeDetected(result.data);
  }

  if (!permission) {
    return <View style={{ backgroundColor: colors.background, flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'center', padding: spacing.xl }}>
        <ScanBarcode color={colors.black} size={56} strokeWidth={2.3} />
        <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Scanner un code-barres</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Autorise la camera pour retrouver les macros d'un produit emballe.</Text>
        <Pressable onPress={requestPermission} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Autoriser la camera</Text>
        </Pressable>
        <Pressable onPress={onBack} style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.black, flex: 1 }}>
      <CameraView
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'space-between', padding: spacing.xl }}>
          <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <ArrowLeft color={colors.black} size={20} strokeWidth={2.6} />
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>Retour</Text>
          </Pressable>
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <View style={{ borderColor: 'white', borderRadius: radius.lg, borderWidth: 3, height: 180, justifyContent: 'center', width: '92%' }}>
              <View style={{ alignSelf: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 4, width: '82%' }} />
            </View>
            <Text style={{ color: 'white', fontSize: typography.heading, fontWeight: '900', textAlign: 'center' }}>Cadre le code-barres</Text>
            <Text style={{ color: '#EDEDED', fontSize: typography.body, fontWeight: '800', textAlign: 'center' }}>Open Food Facts remplit les macros par 100g.</Text>
          </View>
          <View style={{ gap: spacing.md }}>
            <Pressable onPress={onOpenLabelScan} style={{ alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center' }}>
              <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Scanner l'etiquette</Text>
            </Pressable>
            <Pressable onPress={onManualFallback} style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.38)', borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 54, justifyContent: 'center' }}>
              <Keyboard color="white" size={18} strokeWidth={2.4} />
              <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Ajouter manuellement</Text>
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
