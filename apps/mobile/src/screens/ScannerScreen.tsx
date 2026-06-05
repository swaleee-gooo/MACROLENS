import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ArrowLeft, Barcode, Camera, ChevronRight, Image, Keyboard, List, PencilLine, RefreshCw, ScanText, Scale, Search, Sparkles, Sun, Zap } from 'lucide-react-native';
import { ScannerPermissionAsset } from '../components/BrandAssets';
import { useLang } from '../i18n/LanguageContext';
import { getScannerModeConfig, scannerModes, type ScannerIconKey, type ScannerMode } from '../scanner/scannerModes';
import { Eyebrow, PrimaryButton } from '../ui/primitives';
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
  onOpenFoodSearch?: () => void;
  onOpenVerifiedRecipe?: () => void;
  onOpenRecipeImport?: () => void;
};

const STR = {
  en: {
    scannerTitle: 'MacroLens Scanner',
    permissionBody: 'Allow camera access to scan meals, products, and labels. You can still log food without camera access.',
    allowCamera: 'Allow camera',
    gallery: 'Gallery',
    manual: 'Manual',
    back: 'Back',
    labelRequired: 'Label required',
    productNotFound: 'Product not found',
    labelRequiredDetail: 'The product database does not have enough nutrition values. Frame the per-100g table to create the item.',
    productNotFoundDetail: 'Try another angle, enter the code, or scan the nutrition label.',
    tryAgain: 'Try again',
    scanLabel: 'Scan label',
    enterCode: 'Enter code',
    addManually: 'Add manually',
    tipsTitle: 'Tips for a better scan',
    tipLight: 'Use natural light',
    tipFrame: 'Keep the full plate in frame',
    tipBlur: 'Avoid blur, shadows, and extreme angles',
    gotIt: 'Got it',
    enterBarcode: 'Enter barcode',
    barcodePlaceholder: 'Barcode number',
    searchProduct: 'Search this product',
    searching: 'Searching...',
    autoDetection: 'Automatic detection',
    cameraUnavailableTitle: 'Camera unavailable',
    cameraUnavailableDetail: 'Try again in a moment or choose a photo from your library.',
    moreOptions: 'More options',
    searchFood: 'Search a food',
    usdaBase: 'USDA',
    manualEntry: 'Manual entry',
    weighedRecipe: 'Weighed recipe',
    verifiedTag: 'Verified',
    importRecipe: 'Import from a link',
    importTag: 'New',
  },
  fr: {
    scannerTitle: 'Scanner MacroLens',
    permissionBody: 'Autorisez l\'accès à la caméra pour scanner repas, produits et étiquettes. Vous pouvez toujours enregistrer un repas sans caméra.',
    allowCamera: 'Autoriser la caméra',
    gallery: 'Galerie',
    manual: 'Manuel',
    back: 'Retour',
    labelRequired: 'Étiquette requise',
    productNotFound: 'Produit introuvable',
    labelRequiredDetail: 'La base de données produits ne contient pas assez de valeurs nutritionnelles. Cadrez le tableau pour 100g afin de créer l\'article.',
    productNotFoundDetail: 'Essayez un autre angle, saisissez le code ou scannez l\'étiquette nutritionnelle.',
    tryAgain: 'Réessayer',
    scanLabel: 'Scanner l\'étiquette',
    enterCode: 'Saisir le code',
    addManually: 'Ajouter manuellement',
    tipsTitle: 'Conseils pour un meilleur scan',
    tipLight: 'Utilisez la lumière naturelle',
    tipFrame: 'Gardez toute l\'assiette dans le cadre',
    tipBlur: 'Évitez le flou, les ombres et les angles extrêmes',
    gotIt: 'Compris',
    enterBarcode: 'Saisir le code-barres',
    barcodePlaceholder: 'Numéro de code-barres',
    searchProduct: 'Rechercher ce produit',
    searching: 'Recherche...',
    autoDetection: 'Détection automatique',
    cameraUnavailableTitle: 'Caméra indisponible',
    cameraUnavailableDetail: 'Réessayez dans un instant ou choisissez une photo depuis votre galerie.',
    moreOptions: 'Saisir autrement',
    searchFood: 'Rechercher un aliment',
    usdaBase: 'USDA',
    manualEntry: 'Saisie manuelle',
    weighedRecipe: 'Recette pesée',
    verifiedTag: 'Vérifié',
    importRecipe: 'Importer depuis un lien',
    importTag: 'Nouveau',
  },
};

const barcodeTypes = ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'code39', 'code128'] as const;

const iconMap: Record<ScannerIconKey, typeof Camera> = {
  camera: Camera,
  barcode: Barcode,
  label: ScanText,
  library: Image,
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
  const backgroundColor = tone === 'dark' ? colors.night : tone === 'green' ? colors.accentWash : tone === 'outline' ? 'transparent' : colors.paper2;
  const foregroundColor = tone === 'dark' ? '#FFFFFF' : tone === 'green' ? colors.accentInk : colors.ink;
  const borderColor = tone === 'outline' ? colors.line2 : backgroundColor;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor,
        borderColor,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row' as const,
        flexGrow: 1,
        gap: spacing.xs,
        justifyContent: 'center',
        minHeight: 44,
        minWidth: 132,
        opacity: pressed ? 0.82 : 1,
        paddingHorizontal: spacing.md,
      })}
    >
      <Icon color={foregroundColor} size={14} strokeWidth={2} />
      <Text numberOfLines={1} style={{ color: foregroundColor, fontSize: typography.small, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SheetTip({ label, icon: Icon }: { label: string; icon: typeof Camera }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
      <Icon color={colors.ink2} size={15} strokeWidth={2} />
      <Text style={{ color: colors.muted, flex: 1, fontSize: typography.small }}>{label}</Text>
    </View>
  );
}

function MoreRow({ icon: Icon, label, detail, onPress, divider }: { icon: typeof Camera; label: string; detail?: string; onPress: () => void; divider: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ alignItems: 'center', borderTopColor: colors.line, borderTopWidth: divider ? 1 : 0, flexDirection: 'row', gap: spacing.md, opacity: pressed ? 0.7 : 1, paddingVertical: 13 })}>
      <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
        <Icon color={colors.ink2} size={17} strokeWidth={2} />
      </View>
      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '600' }}>{label}</Text>
      {detail ? <Eyebrow>{detail}</Eyebrow> : null}
      <ChevronRight color={colors.muted2} size={16} strokeWidth={2} />
    </Pressable>
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
  onOpenFoodSearch,
  onOpenVerifiedRecipe,
  onOpenRecipeImport,
}: Props) {
  const { lang } = useLang();
  const t = STR[lang];

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
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
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
    setGuidanceOpen(false);
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
        quality: mode === 'label' ? 0.95 : 0.88,
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
      Alert.alert(t.cameraUnavailableTitle, t.cameraUnavailableDetail);
      setIsCapturing(false);
    }
  }

  if (!permission) {
    return <View style={{ backgroundColor: colors.night, flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'center', padding: spacing.xl }}>
        <View style={{ alignItems: 'center' }}>
          <ScannerPermissionAsset height={188} width={256} />
        </View>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.5 }}>{t.scannerTitle}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 24 }}>{t.permissionBody}</Text>
        <PrimaryButton label={t.allowCamera} onPress={requestPermission} variant="dark" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={onOpenLibrary}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.md,
              borderWidth: 1,
              flex: 1,
              flexDirection: 'row' as const,
              gap: spacing.xs,
              justifyContent: 'center',
              minHeight: 50,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Image color={colors.ink2} size={16} strokeWidth={2} />
            <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '600' }}>{t.gallery}</Text>
          </Pressable>
          <Pressable
            onPress={onManualMeal}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.md,
              borderWidth: 1,
              flex: 1,
              flexDirection: 'row' as const,
              gap: spacing.xs,
              justifyContent: 'center',
              minHeight: 50,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <PencilLine color={colors.ink2} size={16} strokeWidth={2} />
            <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '600' }}>{t.manual}</Text>
          </Pressable>
        </View>
        <Pressable onPress={onBack} style={{ alignItems: 'center', minHeight: 48, justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '600' }}>{t.back}</Text>
        </Pressable>
      </View>
    );
  }

  const scanLineTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [6, frameSize.height - 6],
  });

  return (
    <View style={{ backgroundColor: colors.night, flex: 1 }}>
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
        <View style={{ backgroundColor: 'rgba(0,0,0,0.16)', flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
          {/* Top bar */}
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: colors.scannerGlass,
                borderRadius: radius.pill,
                height: 44,
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
                width: 44,
              })}
            >
              <ArrowLeft color={colors.ink} size={21} strokeWidth={2.2} />
            </Pressable>
            <Text style={{ color: '#FFFFFF', fontSize: typography.body, fontWeight: '700' }}>{config.label}</Text>
            <Pressable
              onPress={() => setTorchEnabled((current) => !current)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: torchEnabled ? colors.accent : colors.scannerGlass,
                borderRadius: radius.pill,
                height: 44,
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
                width: 44,
              })}
            >
              <Zap color={torchEnabled ? '#FFFFFF' : colors.ink} size={18} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Viewfinder */}
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
                    backgroundColor: colors.accent,
                    borderRadius: radius.pill,
                    height: 3,
                    left: 0,
                    opacity: 0.92,
                    position: 'absolute',
                    right: 0,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    top: 0,
                    transform: [{ translateY: scanLineTranslate }],
                  }}
                />
              ) : null}
            </View>
            {/* Instruction chip */}
            <View style={{ alignItems: 'center', backgroundColor: colors.scannerPanel, borderRadius: radius.md, gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
              <Text style={{ color: '#FFFFFF', fontSize: typography.subheading, fontWeight: '700', textAlign: 'center' }}>{config.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: typography.small, lineHeight: 19, textAlign: 'center' }}>{config.instruction}</Text>
            </View>
          </View>

          {/* Bottom panel */}
          <View style={{ gap: spacing.sm }}>
            {/* Lookup issue card */}
            {lookupIssue ? (
              <View style={{ backgroundColor: colors.scannerGlass, borderColor: 'rgba(255,255,255,0.30)', borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{
                    alignItems: 'center',
                    backgroundColor: lookupIssue === 'needs_label' ? colors.accentWash : colors.warnWash,
                    borderRadius: radius.md,
                    height: 34,
                    justifyContent: 'center',
                    width: 34,
                  }}>
                    {lookupIssue === 'needs_label'
                      ? <ScanText color={colors.accent} size={16} strokeWidth={2} />
                      : <Barcode color={colors.warn} size={16} strokeWidth={2} />}
                  </View>
                  <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '700' }}>
                    {lookupIssue === 'needs_label' ? t.labelRequired : t.productNotFound}
                  </Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
                  {lookupIssue === 'needs_label'
                    ? t.labelRequiredDetail
                    : t.productNotFoundDetail}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <SheetAction
                    icon={RefreshCw}
                    label={t.tryAgain}
                    onPress={() => {
                      setScanned(false);
                      setLookupIssue(null);
                    }}
                    tone="dark"
                  />
                  <SheetAction icon={ScanText} label={t.scanLabel} onPress={() => switchMode('label')} tone="green" />
                  <SheetAction icon={Keyboard} label={t.enterCode} onPress={openManualBarcodeEntry} />
                  <SheetAction icon={Camera} label={t.addManually} onPress={onManualMeal} tone="outline" />
                </View>
              </View>
            ) : null}

            {/* Guidance card */}
            {guidanceOpen && !lookupIssue ? (
              <View style={{ backgroundColor: colors.scannerGlass, borderColor: 'rgba(255,255,255,0.30)', borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderRadius: radius.md, height: 34, justifyContent: 'center', width: 34 }}>
                    <Sparkles color={colors.accent} size={16} strokeWidth={2} />
                  </View>
                  <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '700' }}>{t.tipsTitle}</Text>
                </View>
                <View style={{ gap: spacing.sm }}>
                  <SheetTip icon={Sun} label={t.tipLight} />
                  <SheetTip icon={Camera} label={t.tipFrame} />
                  <SheetTip icon={ScanText} label={t.tipBlur} />
                </View>
                <Pressable
                  onPress={() => setGuidanceOpen(false)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: colors.night,
                    borderRadius: radius.md,
                    minHeight: 44,
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: typography.small, fontWeight: '700' }}>{t.gotIt}</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Manual barcode entry */}
            {mode === 'barcode' && manualEntryOpen ? (
              <View style={{ backgroundColor: colors.scannerGlass, borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md }}>
                <Eyebrow color={colors.muted}>{t.enterBarcode}</Eyebrow>
                <TextInput
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  keyboardType="number-pad"
                  placeholder={t.barcodePlaceholder}
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600', minHeight: 44 }}
                />
                <Pressable
                  onPress={submitManualBarcode}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: colors.night,
                    borderRadius: radius.md,
                    minHeight: 46,
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: typography.small, fontWeight: '700' }}>{t.searchProduct}</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Mode selector */}
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
                      backgroundColor: isActive ? colors.scannerGlass : 'rgba(255,255,255,0.16)',
                      borderColor: isActive ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.18)',
                      borderRadius: radius.md,
                      borderWidth: 1,
                      flex: 1,
                      gap: spacing.xs,
                      height: 62,
                      justifyContent: 'center',
                      maxWidth: 82,
                    }}
                  >
                    <Icon color={isActive ? colors.ink : '#FFFFFF'} size={18} strokeWidth={2} />
                    <Text style={{ color: isActive ? colors.ink : '#FFFFFF', fontSize: 10, fontWeight: '600' }}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Capture row */}
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' }}>
              {/* Left action: gallery or manual barcode toggle */}
              <Pressable
                onPress={mode === 'barcode' ? () => setManualEntryOpen((current) => !current) : onOpenLibrary}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.88)',
                  borderRadius: radius.pill,
                  height: 48,
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                  width: 48,
                })}
              >
                {mode === 'barcode'
                  ? <Keyboard color={colors.ink} size={18} strokeWidth={2} />
                  : <Image color={colors.ink} size={18} strokeWidth={2} />}
              </Pressable>

              {/* Center: shutter or auto-detect pill */}
              {config.captureType === 'manual_photo' ? (
                <Pressable
                  disabled={!cameraReady || isCapturing}
                  onPress={captureFrame}
                  style={{
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    borderColor: '#FFFFFF',
                    borderRadius: radius.pill,
                    borderWidth: 4,
                    height: 82,
                    justifyContent: 'center',
                    opacity: cameraReady ? 1 : 0.65,
                    width: 82,
                  }}
                >
                  <View style={{ backgroundColor: isCapturing ? colors.accent : '#FFFFFF', borderRadius: radius.pill, height: 62, width: 62 }} />
                </Pressable>
              ) : (
                <View style={{ alignItems: 'center', backgroundColor: colors.scannerPanel, borderColor: 'rgba(255,255,255,0.24)', borderRadius: radius.pill, borderWidth: 1, height: 64, justifyContent: 'center', paddingHorizontal: spacing.md, width: 138 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: typography.small, fontWeight: '600', textAlign: 'center' }}>{scanned ? t.searching : t.autoDetection}</Text>
                </View>
              )}

              {/* Right action: more options sheet */}
              <Pressable
                onPress={() => setMoreOpen(true)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.88)',
                  borderRadius: radius.pill,
                  height: 48,
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                  width: 48,
                })}
              >
                <List color={colors.ink} size={18} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      {moreOpen ? (
        <>
          <Pressable onPress={() => setMoreOpen(false)} style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,10,12,0.5)' }} />
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, bottom: 0, left: 0, paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md, position: 'absolute', right: 0 }}>
            <View style={{ alignSelf: 'center', backgroundColor: colors.line2, borderRadius: 3, height: 4, marginBottom: spacing.md, width: 40 }} />
            <Eyebrow style={{ marginBottom: spacing.sm }}>{t.moreOptions}</Eyebrow>
            {onOpenRecipeImport ? (
              <MoreRow icon={Sparkles} label={t.importRecipe} detail={t.importTag} divider={false} onPress={() => { setMoreOpen(false); onOpenRecipeImport(); }} />
            ) : null}
            <MoreRow icon={Search} label={t.searchFood} detail={t.usdaBase} divider={Boolean(onOpenRecipeImport)} onPress={() => { setMoreOpen(false); onOpenFoodSearch?.(); }} />
            <MoreRow icon={PencilLine} label={t.manualEntry} divider onPress={() => { setMoreOpen(false); onManualMeal(); }} />
            <MoreRow icon={Scale} label={t.weighedRecipe} detail={t.verifiedTag} divider onPress={() => { setMoreOpen(false); onOpenVerifiedRecipe?.(); }} />
          </View>
        </>
      ) : null}
    </View>
  );
}

const cornerBase = {
  borderColor: 'rgba(255,255,255,0.90)',
  height: 40,
  position: 'absolute' as const,
  width: 40,
};

const styles = StyleSheet.create({
  corner: cornerBase,
  cornerTopLeft: {
    borderLeftWidth: 2.5,
    borderTopWidth: 2.5,
    left: 0,
    top: 0,
  },
  cornerTopRight: {
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
    right: 0,
    top: 0,
  },
  cornerBottomLeft: {
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    bottom: 0,
    right: 0,
  },
});
