import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AlertTriangle, ArrowLeft, Link2, ListChecks, Share2, Sparkles } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, PrimaryButton } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';
import { normalizeRecipeUrl, recipePlatformLabel } from '../recipeImport/recipeUrl';
import { RecipeImportLoading } from './RecipeImportLoading';

type Props = {
  initialUrl?: string;
  importing: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onSubmit: (url: string) => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Import a recipe',
    subtitle: 'Paste a TikTok, Instagram, YouTube or recipe link and let MacroLens turn it into an ingredient list with macros.',
    howTo: 'How it works',
    step1: 'Tap Share on a recipe video',
    step2: 'Pick MacroLens in the share sheet',
    step3: 'Review the ingredients, then save',
    linkLabel: 'Recipe link',
    placeholder: 'https://tiktok.com/...',
    detected: 'Detected',
    importCta: 'Import recipe',
    importing: 'Reading the recipe…',
    estimateNote: 'Quantities are AI-estimated from the post — you can adjust everything before saving.',
    errorTitle: 'Import failed',
  },
  fr: {
    brand: 'MacroLens',
    title: 'Importer une recette',
    subtitle: 'Colle un lien TikTok, Instagram, YouTube ou une page de recette et laisse MacroLens en faire une liste d’ingrédients avec les macros.',
    howTo: 'Comment ça marche',
    step1: 'Appuie sur Partager sur une vidéo de recette',
    step2: 'Choisis MacroLens dans le menu de partage',
    step3: 'Vérifie les ingrédients, puis enregistre',
    linkLabel: 'Lien de la recette',
    placeholder: 'https://tiktok.com/...',
    detected: 'Détecté',
    importCta: 'Importer la recette',
    importing: 'Lecture de la recette…',
    estimateNote: 'Les quantités sont estimées par l’IA depuis la publication — tu peux tout ajuster avant d’enregistrer.',
    errorTitle: 'Échec de l’import',
  },
};

function HowToStep({ index, icon: Icon, label }: { index: number; icon: typeof Share2; label: string }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
      <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.md, height: 36, justifyContent: 'center', width: 36 }}>
        <Icon color={colors.ink2} size={17} strokeWidth={2} />
      </View>
      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, fontWeight: '500' }}>
        <Text style={{ color: colors.muted, fontFamily: fonts.mono }}>{index}. </Text>
        {label}
      </Text>
    </View>
  );
}

export function RecipeImportScreen({ initialUrl, importing, errorMessage, onBack, onSubmit }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [url, setUrl] = useState(initialUrl ?? '');

  const normalized = useMemo(() => normalizeRecipeUrl(url), [url]);
  const canImport = normalized !== null && !importing;

  function submit() {
    if (normalized) {
      onSubmit(normalized.url);
    }
  }

  if (importing) {
    return (
      <RecipeImportLoading
        platformLabel={normalized ? recipePlatformLabel(normalized.platform) : null}
        sourceUrl={normalized ? normalized.url : null}
      />
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
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

      {/* Hero */}
      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, height: 54, justifyContent: 'center', width: 54 }}>
          <Sparkles color={colors.accent} size={26} strokeWidth={2} />
        </View>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.5, lineHeight: 34 }}>{t.title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 22 }}>{t.subtitle}</Text>
      </View>

      {/* How it works */}
      <Card style={{ gap: spacing.md, padding: spacing.lg }}>
        <Eyebrow>{t.howTo}</Eyebrow>
        <HowToStep index={1} icon={Share2} label={t.step1} />
        <HowToStep index={2} icon={Sparkles} label={t.step2} />
        <HowToStep index={3} icon={ListChecks} label={t.step3} />
      </Card>

      {/* Link input */}
      <Card style={{ gap: spacing.sm, padding: spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Eyebrow>{t.linkLabel}</Eyebrow>
          {normalized ? (
            <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 4 }}>
              <Eyebrow color={colors.accentInk}>{t.detected}</Eyebrow>
              <Text style={{ color: colors.accentInk, fontFamily: fonts.mono, fontSize: 11, fontWeight: '600' }}>{recipePlatformLabel(normalized.platform)}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Link2 color={colors.muted} size={18} strokeWidth={2} />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder={t.placeholder}
            placeholderTextColor={colors.muted2}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!importing}
            onSubmitEditing={submit}
            returnKeyType="go"
            style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '600', minHeight: 40 }}
          />
        </View>
      </Card>

      {/* Error */}
      {errorMessage ? (
        <View style={{ backgroundColor: colors.dangerWash, borderColor: colors.dangerLine, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.lg }}>
          <AlertTriangle color={colors.dangerInk} size={18} strokeWidth={2} />
          <View style={{ flex: 1, gap: 2 }}>
            <Eyebrow color={colors.dangerInk}>{t.errorTitle}</Eyebrow>
            <Text style={{ color: colors.dangerInk, fontSize: typography.small, lineHeight: 19 }}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}

      {/* Import CTA */}
      <PrimaryButton
        label={importing ? t.importing : t.importCta}
        onPress={submit}
        disabled={!canImport}
        variant="accent"
        icon={<Sparkles color="#FFFFFF" size={17} strokeWidth={2} />}
      />

      {/* Honesty note */}
      <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16, textAlign: 'center' }}>{t.estimateNote}</Text>
    </ScrollView>
  );
}
