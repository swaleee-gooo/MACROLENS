import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Barcode, Camera, Image, PencilLine, Scale, ScanText, Search, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, PrimaryButton, Seal } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';
import type { ScannerMode } from '../scanner/scannerModes';

type Props = {
  onBack: () => void;
  onOpenScanner: (mode: ScannerMode) => void;
  onOpenLibrary: () => void;
  onOpenFoodSearch: () => void;
  onOpenManualMeal: () => void;
  onOpenVerifiedRecipe: () => void;
  onOpenRecipeImport: () => void;
  onOpenCalibration: () => void;
  onOpenBenchmark: () => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Log food',
    subtitle: 'Choose the fastest capture method for this meal.',
    mealPhoto: 'Meal photo',
    mealPhotoDetail: 'Best for plates, bowls, and restaurant meals.',
    startScan: 'Start scan',
    barcodeTitle: 'Barcode',
    barcodeDetail: 'Packaged food lookup.',
    labelTitle: 'Label',
    labelDetail: 'Read per-100g values.',
    galleryTitle: 'Gallery',
    galleryDetail: 'Use an existing photo.',
    recipeTitle: 'Recipe',
    recipeDetail: 'Known ingredients and grams.',
    importTitle: 'Import from a link',
    importDetail: 'Paste a TikTok or recipe link — AI lists every ingredient with macros.',
    importBadge: 'New',
    searchFood: 'Search food database',
    calibrationSample: 'Calibration sample',
    manualAdd: 'Manual add',
    benchmarkDev: 'Benchmark / dev',
  },
  fr: {
    brand: 'MacroLens',
    title: 'Ajouter un repas',
    subtitle: 'Choisissez la méthode de capture la plus rapide pour ce repas.',
    mealPhoto: 'Photo du repas',
    mealPhotoDetail: 'Idéal pour les assiettes, bols et repas au restaurant.',
    startScan: 'Lancer le scan',
    barcodeTitle: 'Code-barres',
    barcodeDetail: 'Recherche d\'aliments emballés.',
    labelTitle: 'Étiquette',
    labelDetail: 'Lire les valeurs pour 100g.',
    galleryTitle: 'Galerie',
    galleryDetail: 'Utiliser une photo existante.',
    recipeTitle: 'Recette',
    recipeDetail: 'Ingrédients et grammes connus.',
    importTitle: 'Importer depuis un lien',
    importDetail: 'Colle un lien TikTok ou recette — l’IA liste chaque ingrédient avec les macros.',
    importBadge: 'Nouveau',
    searchFood: 'Rechercher dans la base alimentaire',
    calibrationSample: 'Échantillon de calibration',
    manualAdd: 'Saisie manuelle',
    benchmarkDev: 'Benchmark / dev',
  },
};

function SecondaryChoice({ title, detail, icon: Icon, onPress }: { title: string; detail: string; icon: typeof Camera; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.lg,
        borderWidth: 1,
        flex: 1,
        gap: spacing.sm,
        minHeight: 112,
        minWidth: 142,
        opacity: pressed ? 0.88 : 1,
        padding: spacing.md,
      })}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.md, height: 38, justifyContent: 'center', width: 38 }}>
        <Icon color={colors.ink2} size={19} strokeWidth={2} />
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 15 }}>{detail}</Text>
      </View>
    </Pressable>
  );
}

function RowAction({ label, icon: Icon, onPress }: { label: string; icon: typeof Search; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: 'row' as const,
        gap: spacing.md,
        minHeight: 54,
        opacity: pressed ? 0.88 : 1,
        paddingHorizontal: spacing.lg,
      })}
    >
      <Icon color={colors.ink2} size={18} strokeWidth={2} />
      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function ScanHubScreen({ onBack, onOpenScanner, onOpenLibrary, onOpenFoodSearch, onOpenManualMeal, onOpenVerifiedRecipe, onOpenRecipeImport, onOpenCalibration, onOpenBenchmark }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.pill,
            borderWidth: 1,
            height: 40,
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            width: 40,
          })}
        >
          <ArrowLeft color={colors.ink} size={19} strokeWidth={2.2} />
        </Pressable>
        <Eyebrow>{t.brand}</Eyebrow>
        <View style={{ width: 40 }} />
      </View>

      {/* Title */}
      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 }}>{t.title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 22 }}>{t.subtitle}</Text>
      </View>

      {/* Primary CTA — meal photo */}
      <Pressable
        onPress={() => onOpenScanner('meal')}
        style={({ pressed }) => ({
          backgroundColor: colors.ink,
          borderRadius: radius.lg,
          gap: spacing.md,
          opacity: pressed ? 0.92 : 1,
          padding: spacing.lg,
        })}
      >
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, height: 50, justifyContent: 'center', width: 50 }}>
            <Camera color="#FFFFFF" size={24} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={{ color: '#FFFFFF', fontSize: typography.subheading, fontWeight: '700' }}>{t.mealPhoto}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: typography.small, lineHeight: 19 }}>{t.mealPhotoDetail}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: typography.small, fontWeight: '700' }}>{t.startScan}</Text>
        </View>
      </Pressable>

      {/* Flagship — import a recipe from a social/web link */}
      <Pressable
        onPress={onOpenRecipeImport}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: colors.accentWash,
          borderColor: colors.accentLine,
          borderRadius: radius.lg,
          borderWidth: 1,
          flexDirection: 'row',
          gap: spacing.md,
          opacity: pressed ? 0.9 : 1,
          padding: spacing.lg,
        })}
      >
        <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, height: 46, justifyContent: 'center', width: 46 }}>
          <Sparkles color={colors.accent} size={22} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <Text style={{ color: colors.accentInk, fontSize: typography.body, fontWeight: '700' }}>{t.importTitle}</Text>
            <View style={{ backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>{t.importBadge}</Text>
            </View>
          </View>
          <Text style={{ color: colors.accentInk, fontSize: typography.tiny, lineHeight: 15, opacity: 0.85 }}>{t.importDetail}</Text>
        </View>
      </Pressable>

      {/* Secondary grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <SecondaryChoice detail={t.barcodeDetail} icon={Barcode} title={t.barcodeTitle} onPress={() => onOpenScanner('barcode')} />
        <SecondaryChoice detail={t.labelDetail} icon={ScanText} title={t.labelTitle} onPress={() => onOpenScanner('label')} />
        <SecondaryChoice detail={t.galleryDetail} icon={Image} title={t.galleryTitle} onPress={onOpenLibrary} />
        <SecondaryChoice detail={t.recipeDetail} icon={ShieldCheck} title={t.recipeTitle} onPress={onOpenVerifiedRecipe} />
      </View>

      {/* Row actions */}
      <View style={{ gap: spacing.sm }}>
        <RowAction icon={Search} label={t.searchFood} onPress={onOpenFoodSearch} />
        <RowAction icon={Scale} label={t.calibrationSample} onPress={onOpenCalibration} />
      </View>

      {/* Manual add */}
      <PrimaryButton
        label={t.manualAdd}
        onPress={onOpenManualMeal}
        variant="dark"
        icon={<PencilLine color="#FFFFFF" size={17} strokeWidth={2} />}
      />

      {/* Dev benchmark */}
      {__DEV__ ? (
        <Pressable
          onPress={onOpenBenchmark}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: colors.blueSoft,
            borderRadius: radius.md,
            flexDirection: 'row' as const,
            gap: spacing.sm,
            justifyContent: 'center',
            minHeight: 46,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <ScanText color={colors.blue} size={16} strokeWidth={2} />
          <Text style={{ color: colors.blue, fontSize: typography.small, fontWeight: '600' }}>{t.benchmarkDev}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
