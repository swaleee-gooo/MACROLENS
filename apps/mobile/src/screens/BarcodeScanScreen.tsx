import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ArrowLeft, Keyboard, ScanBarcode, Zap } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onOpenLabelScan: () => void;
  onManualBarcode: (barcode: string) => void;
  onManualFallback: () => void;
};

export function BarcodeScanScreen({ onBack, onBarcodeDetected, onOpenLabelScan, onManualBarcode, onManualFallback }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned || !result.data) {
      return;
    }

    setScanned(true);
    onBarcodeDetected(result.data);
  }

  function submitManualBarcode() {
    const barcode = manualBarcode.trim();
    if (barcode.length === 0) {
      return;
    }

    setScanned(true);
    onManualBarcode(barcode);
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
        active={!scanned}
        animateShutter={false}
        enableTorch={torchEnabled}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'code39', 'code128'] }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
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
            <Text style={{ color: '#EDEDED', fontSize: typography.body, fontWeight: '800', textAlign: 'center' }}>Le produit s'ouvre ensuite avec sa portion, pas comme un repas.</Text>
          </View>
          <View style={{ gap: spacing.md }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.md, gap: spacing.sm, padding: spacing.md }}>
              <TextInput
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="number-pad"
                placeholder="Entrer le code si la camera bloque"
                placeholderTextColor={colors.muted}
                style={{ color: colors.black, fontSize: typography.body, fontWeight: '900', minHeight: 44 }}
              />
              <Pressable onPress={submitManualBarcode} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 46, justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>Chercher ce produit</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setTorchEnabled((current) => !current)} style={{ alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.38)', borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md }}>
              <Zap color={torchEnabled ? colors.greenSoft : 'white'} size={17} strokeWidth={2.4} />
              <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>Torche</Text>
            </Pressable>
            <Pressable onPress={onOpenLabelScan} style={{ alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center' }}>
              <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Scanner l'etiquette</Text>
            </Pressable>
            <Pressable onPress={onManualFallback} style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.38)', borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 54, justifyContent: 'center' }}>
              <Keyboard color="white" size={18} strokeWidth={2.4} />
              <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Ajouter manuellement</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
