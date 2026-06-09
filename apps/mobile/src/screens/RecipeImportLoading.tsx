import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ArrowRight } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { fetchRecipeThumbnailUrl } from '../recipeImport/recipeThumbnail';
import { computeRecipeTotals, perServingTotals } from '../recipeImport/recipeNutrition';
import type { ImportedRecipe } from '../recipeImport/recipeSchema';
import { macroBarSegments } from '../share/shareCardContent';
import { Eyebrow, PrimaryButton } from '../ui/primitives';
import { colors, fonts, spacing, typography } from '../ui/theme';

/**
 * Two-phase "wow" loader for recipe import (validated design, Mobbin-inspired):
 *
 *  1. SCAN  — the post's dish photo sits inside a ring that fills 0→100% while the
 *     AI extracts the recipe; a soft halo keeps it alive and the status cycles.
 *  2. REVEAL — when the real recipe lands, the ring completes, the photo grows into
 *     a big square, and the REAL per-serving calories + macros count up (dopamine),
 *     then we hand off to the review screen.
 *
 * Pure JS: react-native Animated + already-bundled react-native-svg (OTA-safe).
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SVG = 184;
const R = 82;
const C = 2 * Math.PI * R;
const HERO_SCAN = 184;
const HERO_REVEAL = 248;
const PHOTO_SCAN = 130;
const PHOTO_REVEAL = 248;

const STR = {
  en: {
    brand: 'MacroLens',
    scanTitle: 'Cooking up your recipe',
    revealTitle: 'Crunching your macros 🔥',
    revealCaption: 'Locking in your macros ✨',
    captions: ['Reading the post 🔍', 'Spotting ingredients 🥢', 'Estimating portions ⚖️'],
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    seeRecipe: 'See the recipe',
  },
  fr: {
    brand: 'MacroLens',
    scanTitle: 'On prépare ta recette',
    revealTitle: 'On calcule tes macros 🔥',
    revealCaption: 'On verrouille tes macros ✨',
    captions: ['Lecture du post 🔍', 'Repérage des ingrédients 🥢', 'Estimation des portions ⚖️'],
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    seeRecipe: 'Voir la recette',
  },
};

function isHttp(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

type Props = {
  platformLabel?: string | null;
  sourceUrl?: string | null;
  result?: ImportedRecipe | null;
  onRevealComplete?: (recipe: ImportedRecipe) => void;
};

export function RecipeImportLoading({ platformLabel, sourceUrl, result, onRevealComplete }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const ringFill = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const captionOpacity = useRef(new Animated.Value(1)).current;

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [phase, setPhase] = useState<'scan' | 'reveal'>('scan');
  const [pct, setPct] = useState(0);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [numbers, setNumbers] = useState({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const [sparkle, setSparkle] = useState(false);

  const revealStarted = useRef(false);

  // Per-serving target for the reveal counters.
  const serving = result ? perServingTotals(computeRecipeTotals(result.ingredients), result.servings) : null;
  const segments = serving ? macroBarSegments({ proteinG: serving.proteinG, carbsG: serving.carbsG, fatG: serving.fatG }) : null;
  const photoUri = thumbnail ?? (result && isHttp(result.imageUrl) ? result.imageUrl : null);

  // Fetch the dish photo in parallel (cosmetic, fails to null).
  useEffect(() => {
    if (!sourceUrl) {
      return undefined;
    }
    let cancelled = false;
    fetchRecipeThumbnailUrl(sourceUrl)
      .then((uri) => {
        if (!cancelled && uri) {
          setThumbnail(uri);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  // Scan: ring climbs fast to ~86%, then keeps creeping toward ~99% (never freezes)
  // until the result lands and completes it. A soft halo keeps it alive.
  useEffect(() => {
    const listener = ringFill.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.sequence([
      Animated.timing(ringFill, { toValue: 0.86, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(ringFill, { toValue: 0.99, duration: 12000, easing: Easing.linear, useNativeDriver: false }),
    ]).start();
    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    halo.start();
    return () => {
      ringFill.removeListener(listener);
      halo.stop();
    };
  }, [ringFill, pulse]);

  // Scan captions cycle until the reveal begins.
  useEffect(() => {
    if (phase !== 'scan') {
      return undefined;
    }
    const id = setInterval(() => {
      Animated.timing(captionOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setCaptionIdx((current) => (current + 1) % t.captions.length);
        Animated.timing(captionOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, 1500);
    return () => clearInterval(id);
  }, [phase, captionOpacity, t.captions.length]);

  // Reveal: when the real recipe arrives, complete the ring, morph the photo, count
  // up the real macros, then hand off to the review screen.
  useEffect(() => {
    if (!result || revealStarted.current) {
      return undefined;
    }
    revealStarted.current = true;

    const servingLocal = perServingTotals(computeRecipeTotals(result.ingredients), result.servings);
    const target = { kcal: servingLocal.kcal, proteinG: Math.round(servingLocal.proteinG), carbsG: Math.round(servingLocal.carbsG), fatG: Math.round(servingLocal.fatG) };
    const countListener = count.addListener(({ value }) => {
      setNumbers({
        kcal: Math.round(value * target.kcal),
        proteinG: Math.round(value * target.proteinG),
        carbsG: Math.round(value * target.carbsG),
        fatG: Math.round(value * target.fatG),
      });
    });

    Animated.timing(ringFill, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: false }).start(() => {
      setPhase('reveal');
      Animated.parallel([
        Animated.timing(morph, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(count, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start(() => {
        setSparkle(true);
      });
    });

    return () => {
      count.removeListener(countListener);
    };
  }, [result, ringFill, morph, count]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.4] });
  const heroSize = morph.interpolate({ inputRange: [0, 1], outputRange: [HERO_SCAN, HERO_REVEAL] });
  const photoSize = morph.interpolate({ inputRange: [0, 1], outputRange: [PHOTO_SCAN, PHOTO_REVEAL] });
  const photoRadius = morph.interpolate({ inputRange: [0, 1], outputRange: [PHOTO_SCAN / 2, 26] });
  const ringOpacity = morph.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0], extrapolate: 'clamp' });
  const badgeOpacity = morph.interpolate({ inputRange: [0, 0.32], outputRange: [1, 0], extrapolate: 'clamp' });
  const revealOpacity = morph.interpolate({ inputRange: [0.25, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const revealTranslateY = morph.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const dashOffset = ringFill.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });

  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Eyebrow>{t.brand}</Eyebrow>
        {platformLabel ? (
          <View style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 7, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text style={{ color: colors.accentInk, fontFamily: fonts.mono, fontSize: 11, fontWeight: '600', letterSpacing: 0.4 }}>{platformLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Hero: photo (circle → square) + scanning ring */}
      <Animated.View style={{ alignItems: 'center', height: heroSize, justifyContent: 'center', marginTop: spacing.xl, position: 'relative', width: heroSize }}>
        {phase === 'scan' ? (
          <Animated.View
            style={{
              backgroundColor: colors.accentWash,
              borderRadius: 999,
              height: PHOTO_SCAN + 22,
              opacity: haloOpacity,
              position: 'absolute',
              transform: [{ scale: haloScale }],
              width: PHOTO_SCAN + 22,
            }}
          />
        ) : null}

        {/* Scanning ring */}
        <Animated.View style={{ opacity: ringOpacity, position: 'absolute' }} pointerEvents="none">
          <Svg width={RING_SVG} height={RING_SVG} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={RING_SVG / 2} cy={RING_SVG / 2} r={R} stroke={colors.line} strokeWidth={7} fill="none" />
            <AnimatedCircle
              cx={RING_SVG / 2}
              cy={RING_SVG / 2}
              r={R}
              stroke={colors.accent}
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
            />
          </Svg>
        </Animated.View>

        {/* Dish photo */}
        <Animated.View style={{ backgroundColor: colors.ink, borderRadius: photoRadius, height: photoSize, overflow: 'hidden', width: photoSize }}>
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} resizeMode="cover" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,8,8,0.18)' }]} />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: 'rgba(255,255,255,0.16)', fontFamily: fonts.display, fontSize: 48, fontWeight: '700', letterSpacing: -2 }}>ML</Text>
            </View>
          )}
        </Animated.View>

        {/* % badge (scan only) */}
        <Animated.View style={{ alignItems: 'center', bottom: 8, left: 0, opacity: badgeOpacity, position: 'absolute', right: 0 }} pointerEvents="none">
          <View style={{ backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: 15, fontWeight: '600' }}>
              {pct}
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>%</Text>
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Reveal: real calories + macros counting up */}
      {phase === 'reveal' && serving && segments ? (
        <Animated.View style={{ marginTop: spacing.lg, opacity: revealOpacity, transform: [{ translateY: revealTranslateY }], width: '100%' }}>
          <View style={{ alignItems: 'center', position: 'relative' }}>
            {sparkle ? <Text style={{ fontSize: 22, position: 'absolute', right: 28, top: -10 }}>✨</Text> : null}
            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 6 }}>
              <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 50, fontWeight: '600', letterSpacing: -2 }}>{numbers.kcal}</Text>
              <Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: 15, fontWeight: '500', marginBottom: 8 }}>kcal</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <MacroCol color={colors.protein} label={t.protein} grams={numbers.proteinG} pct={segments.proteinPct} count={count} />
            <MacroCol color={colors.carbs} label={t.carbs} grams={numbers.carbsG} pct={segments.carbsPct} count={count} />
            <MacroCol color={colors.fat} label={t.fat} grams={numbers.fatG} pct={segments.fatPct} count={count} />
          </View>
        </Animated.View>
      ) : null}

      {/* Title + caption */}
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl }}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' }}>
          {phase === 'reveal' ? t.revealTitle : t.scanTitle}
        </Text>
        {phase === 'reveal' ? (
          <Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: typography.small, textAlign: 'center' }}>{t.revealCaption}</Text>
        ) : (
          <Animated.Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: typography.small, opacity: captionOpacity, textAlign: 'center' }}>
            {t.captions[captionIdx]}
          </Animated.Text>
        )}
      </View>

      {/* User-controlled hand-off to the review screen */}
      {phase === 'reveal' && result ? (
        <Animated.View style={{ marginTop: spacing.xl, opacity: revealOpacity, width: '100%' }}>
          <PrimaryButton
            label={t.seeRecipe}
            onPress={() => onRevealComplete?.(result)}
            variant="accent"
            icon={<ArrowRight color="#FFFFFF" size={18} strokeWidth={2.2} />}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

function MacroCol({ color, label, grams, pct, count }: { color: string; label: string; grams: number; pct: number; count: Animated.Value }) {
  const width = count.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(2, Math.round(pct))}%`], extrapolate: 'clamp' });
  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
        <View style={{ backgroundColor: color, borderRadius: 2, height: 8, width: 8 }} />
        <Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: 10, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</Text>
      </View>
      <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 17, fontWeight: '600', marginTop: 5 }}>{grams}g</Text>
      <View style={{ backgroundColor: colors.line, borderRadius: 999, height: 6, marginTop: 6, overflow: 'hidden' }}>
        <Animated.View style={{ backgroundColor: color, borderRadius: 999, height: 6, width }} />
      </View>
    </View>
  );
}
