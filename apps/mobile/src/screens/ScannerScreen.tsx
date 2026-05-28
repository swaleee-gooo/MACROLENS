import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ArrowLeft, Barcode, Camera, ImagePlus, Keyboard, RefreshCw, ScanText, Sparkles, Sun, Zap } from 'lucide-react-native';
import { getScannerModeConfig, scannerModes, type ScannerIconKey, type ScannerMode } from '../scanner/scannerModes';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  initialMode?: ScannerMode;
  productLookupError?: boolean;
  productLookupIssue?: 'not_found' | 'needs_label';
  onBack: () => void;
  onMealPhoto: (imageUri: string) => void | Promise<void>;
  onLabelPhoto: (imageUri: string) => void | Promise<void>;
  onBarcodeDetected: (barcode: string) => void;
  onManualBarcode: (barcode: string) => void;
  onManualMeal: () => void;
  onOpenLibrary: () => void | Promise<void>;
};

const barcodeTypes = ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'code39', 'code128'] as const;

const iconMap: Record<ScannerIconKey, typeof Camera> = {
  camera: Camera,
  barcode: Barcode,
  label: ScanText,
  library: ImagePlus,
};

function SheetAction({
  label,
  icon: Icon,
  tone = 'light',
  onPress,
}: {
  label: string;
  icon: typeof Camera;
  tone?: 'dark' | 'green' | 'light' | 'outline';
  onPress: () => void;
}) {
  const backgroundColor = tone === 'dark' ? colors.black : tone === 'green' ? colors.greenSoft : tone === 'outline' ? 'transparent' : colors.surfaceMuted;
  const foregroundColor = tone === 'dark' ? 'white' : tone === 'green' ? colors.green : colors.black;
  const borderColor = tone === 'outline' ? colors.line : backgroundColor;

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor,
        borderColor,
        borderRadius: radius.pill,
        borderWidth: 1,
        flexDirection: 'row',
        flexGrow: 1,
        gap: spacing.xs,
        justifyContent: 'center',
        minHeight: 44,
        minWidth: 132,
        paddingHorizontal: spacing.md,
      }}
    >
      <Icon color={foregroundColor} size={15} strokeWidth={2.6} />
      <Text numberOfLines={1} style={{ color: foregroundColor, fontSize: typography.small, fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SheetTip({ label, icon: Icon }: { label: string; icon: typeof Camera }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
      <Icon color={colors.black} size={16} strokeWidth={2.4} />
      <Text style={{ color: colors.muted, flex: 1, fontSize: typography.small, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

function frameSizeFor(mode: ScannerMode, width: number) {
  const frameWidth = Math.min(width - spacing.xl * 2, 370);

  if (mode === 'barcode') {
    return { width: frameWidth, height: 174 };
  }

  if (mode === 'label') {
    return { width: frameWidth, height: 282 };
  }

  return { width: frameWidth, height: Math.min(frameWidth, 328) };
}

export function ScannerScreen({
  initialMode = 'meal',
  productLookupError = false,
  productLookupIssue,
  onBack,
  onMealPhoto,
  onLabelPhoto,
  onBarcodeDetected,
  onManualBarcode,
  onManualMeal,
  onOpenLibrary,
}: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const scanLine = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScannerMode>(initialMode);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [lookupIssue, setLookupIssue] = useState<'not_found' | 'needs_label' | null>(
    productLookupError ? productLookupIssue ?? 'not_found' : null,
  );
  const [manualEntryOpen, setManualEntryOpen] = useState(productLookupError);
  const [guidanceOpen, setGuidanceOpen] = useState(initialMode === 'meal');
  const [manualBarcode, setManualBarcode] = useState('');
  const { width } = useWindowDimensions();
  const config = getScannerModeConfig(mode);
  const frameSize = useMemo(() => frameSizeFor(mode, width), [mode, width]);

  useEffect(() => {
    setMode(initialMode);
    setScanned(false);
  }, [initialMode]);

  useEffect(() => {
    if (productLookupError) {
      const nextIssue = productLookupIssue ?? 'not_found';
      setLookupIssue(nextIssue);
      setManualEntryOpen(nextIssue === 'not_found');
    }
  }, [productLookupError, productLookupIssue]);

  useEffect(() => {
    scanLine.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          duration: mode === 'barcode' ? 1150 : 1650,
          toValue: 1,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scanLine, {
          duration: 850,
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [mode, scanLine]);

  function switchMode(nextMode: ScannerMode) {
    if (nextMode === 'library') {
      void onOpenLibrary();
      return;
    }

    setMode(nextMode);
    setScanned(false);
    setLookupIssue(null);
    setManualEntryOpen(false);
    setGuidanceOpen(nextMode === 'meal');
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (mode !== 'barcode' || scanned || !result.data) {
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

  function openManualBarcodeEntry() {
    setMode('barcode');
    setScanned(false);
    setManualEntryOpen(true);
  }

  async function captureFrame() {
    if (!cameraReady || isCapturing || config.captureType !== 'manual_photo') {
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({
        quality: mode === 'label' ? 0.92 : 0.78,
        shutterSound: false,
      });

      if (!photo?.uri) {
        throw new Error('photo_missing');
      }

      if (mode === 'label') {
        await onLabelPhoto(photo.uri);
      } else {
        await onMealPhoto(photo.uri);
      }
    } catch {
      Alert.alert('Camera indisponible', 'Reessaie dans quelques instants ou choisis une photo depuis ta bibliotheque.');
      setIsCapturing(false);
    }
  }

  if (!permission) {
    return <View style={{ backgroundColor: colors.black, flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'center', padding: spacing.xl }}>
        <Camera color={colors.black} size={56} strokeWidth={2.3} />
        <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Scanner MacroLens</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Autorise la camera pour scanner tes repas, produits et etiquettes sans quitter l'app.</Text>
        <Pressable onPress={requestPermission} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Autoriser la camera</Text>
        </Pressable>
        <Pressable onPress={onBack} style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const scanLineTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [18, frameSize.height - 22],
  });

  return (
    <View style={{ backgroundColor: colors.black, flex: 1 }}>
      <CameraView
        ref={cameraRef}
        active
        animateShutter={false}
        enableTorch={torchEnabled}
        facing="back"
        mode="picture"
        onBarcodeScanned={mode === 'barcode' && !scanned ? handleBarcodeScanned : undefined}
        onCameraReady={() => setCameraReady(true)}
        barcodeScannerSettings={{ barcodeTypes: [...barcodeTypes] }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.18)', flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={onBack} style={{ alignItems: 'center', backgroundColor: colors.scannerGlass, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 }}>
              <ArrowLeft color={colors.black} size={24} strokeWidth={2.7} />
            </Pressable>
            <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Scanner</Text>
            <Pressable onPress={() => setTorchEnabled((current) => !current)} style={{ alignItems: 'center', backgroundColor: torchEnabled ? colors.greenSoft : colors.scannerGlass, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 }}>
              <Zap color={colors.black} size={20} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <View style={{ alignItems: 'center', height: frameSize.height, justifyContent: 'center', width: frameSize.width }}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              {config.frameVariant === 'barcode' ? (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radius.pill, height: 3, width: '78%' }} />
              ) : null}
              {config.frameVariant === 'label' ? (
                <View style={{ borderColor: 'rgba(255,255,255,0.72)', borderRadius: radius.sm, borderWidth: 1, height: '58%', width: '78%' }} />
              ) : null}
              {config.frameVariant !== 'none' ? (
                <Animated.View
                  style={{
                    backgroundColor: colors.greenSoft,
                    borderRadius: radius.pill,
                    height: 3,
                    opacity: 0.92,
                    position: 'absolute',
                    shadowColor: colors.greenSoft,
                    shadowOpacity: 0.9,
                    shadowRadius: 12,
                    transform: [{ translateY: scanLineTranslate }],
                    width: '78%',
                  }}
                />
              ) : null}
            </View>
            <View style={{ alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg }}>
              <Text style={{ color: 'white', fontSize: typography.heading, fontWeight: '900', textAlign: 'center' }}>{config.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: typography.small, fontWeight: '800', lineHeight: 19, textAlign: 'center' }}>{config.instruction}</Text>
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            {lookupIssue ? (
              <View style={{ backgroundColor: colors.scannerGlass, borderColor: 'rgba(255,255,255,0.42)', borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ alignItems: 'center', backgroundColor: lookupIssue === 'needs_label' ? colors.greenSoft : colors.amberSoft, borderRadius: radius.pill, height: 34, justifyContent: 'center', width: 34 }}>
                    {lookupIssue === 'needs_label' ? <ScanText color={colors.green} size={18} strokeWidth={2.6} /> : <Barcode color={colors.amber} size={18} strokeWidth={2.6} />}
                  </View>
                  <Text style={{ color: colors.black, flex: 1, fontSize: typography.body, fontWeight: '900' }}>{lookupIssue === 'needs_label' ? 'Etiquette requise' : 'Produit introuvable'}</Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>
                  {lookupIssue === 'needs_label'
                    ? "La base produit n'a pas assez de valeurs nutritionnelles. Cadre le tableau par 100 g pour creer la fiche."
                    : "Essaie un autre angle, entre le code ou scanne l'etiquette nutritionnelle."}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <SheetAction
                    icon={RefreshCw}
                    label="Reessayer"
                    onPress={() => {
                      setScanned(false);
                      setLookupIssue(null);
                    }}
                    tone="dark"
                  />
                  <SheetAction icon={ScanText} label="Scanner l'etiquette" onPress={() => switchMode('label')} tone="green" />
                  <SheetAction icon={Keyboard} label="Entrer le code" onPress={openManualBarcodeEntry} />
                  <SheetAction icon={Camera} label="Ajouter manuellement" onPress={onManualMeal} tone="outline" />
                </View>
              </View>
            ) : null}

            {guidanceOpen && !lookupIssue ? (
              <View style={{ backgroundColor: colors.scannerGlass, borderColor: 'rgba(255,255,255,0.42)', borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 34, justifyContent: 'center', width: 34 }}>
                    <Sparkles color={colors.green} size={18} strokeWidth={2.6} />
                  </View>
                  <Text style={{ color: colors.black, flex: 1, fontSize: typography.body, fontWeight: '900' }}>Tips pour un meilleur scan</Text>
                </View>
                <View style={{ gap: spacing.sm }}>
                  <SheetTip icon={Sun} label="Utilise une lumiere naturelle" />
                  <SheetTip icon={Camera} label="Garde tout le plat dans le cadre" />
                  <SheetTip icon={ScanText} label="Evite flou, ombres et angles extremes" />
                </View>
                <Pressable onPress={() => setGuidanceOpen(false)} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>Compris</Text>
                </Pressable>
              </View>
            ) : null}

            {mode === 'barcode' && manualEntryOpen ? (
              <View style={{ backgroundColor: colors.scannerGlass, borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md }}>
                <TextInput
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  keyboardType="number-pad"
                  placeholder="Entrer le code-barres"
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.black, fontSize: typography.body, fontWeight: '900', minHeight: 44 }}
                />
                <Pressable onPress={submitManualBarcode} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 46, justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>Chercher ce produit</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
              {scannerModes.map((scannerMode) => {
                const item = getScannerModeConfig(scannerMode);
                const Icon = iconMap[item.icon];
                const isActive = scannerMode === mode;

                return (
                  <Pressable
                    key={scannerMode}
                    onPress={() => switchMode(scannerMode)}
                    style={{
                      alignItems: 'center',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.22)',
                      borderColor: isActive ? 'white' : 'rgba(255,255,255,0.22)',
                      borderRadius: radius.md,
                      borderWidth: 1,
                      flex: 1,
                      gap: spacing.xs,
                      height: 70,
                      justifyContent: 'center',
                      maxWidth: 82,
                    }}
                  >
                    <Icon color={isActive ? colors.black : 'white'} size={19} strokeWidth={2.4} />
                    <Text style={{ color: isActive ? colors.black : 'white', fontSize: 10, fontWeight: '900' }}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' }}>
              <Pressable
                onPress={mode === 'barcode' ? () => setManualEntryOpen((current) => !current) : onOpenLibrary}
                style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 }}
              >
                {mode === 'barcode' ? <Keyboard color={colors.black} size={19} strokeWidth={2.4} /> : <ImagePlus color={colors.black} size={19} strokeWidth={2.4} />}
              </Pressable>

              {config.captureType === 'manual_photo' ? (
                <Pressable
                  disabled={!cameraReady || isCapturing}
                  onPress={captureFrame}
                  style={{
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderColor: 'white',
                    borderRadius: radius.pill,
                    borderWidth: 4,
                    height: 82,
                    justifyContent: 'center',
                    opacity: cameraReady ? 1 : 0.65,
                    width: 82,
                  }}
                >
                  <View style={{ backgroundColor: isCapturing ? colors.greenSoft : 'white', borderRadius: radius.pill, height: 62, width: 62 }} />
                </Pressable>
              ) : (
                <View style={{ alignItems: 'center', backgroundColor: colors.scannerPanel, borderColor: 'rgba(255,255,255,0.3)', borderRadius: radius.pill, borderWidth: 1, height: 64, justifyContent: 'center', paddingHorizontal: spacing.md, width: 138 }}>
                  <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900', textAlign: 'center' }}>{scanned ? 'Recherche...' : 'Detection automatique'}</Text>
                </View>
              )}

              <Pressable onPress={onManualMeal} style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 }}>
                <Text style={{ color: colors.black, fontSize: 22, fontWeight: '900' }}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const cornerBase = {
  borderColor: 'white',
  height: 42,
  position: 'absolute' as const,
  width: 42,
};

const styles = StyleSheet.create({
  corner: cornerBase,
  cornerTopLeft: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  cornerTopRight: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  cornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
});
