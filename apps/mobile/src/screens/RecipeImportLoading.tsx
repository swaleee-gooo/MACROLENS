import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Check } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Eyebrow } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

/**
 * "Wow" loading moment while the AI extracts a recipe from a shared link.
 *
 * Pattern (validated against best-in-class food/AI scanners): a scanned target
 * swept by a light beam + macro dots orbiting a dotted ring + a staged analysis
 * checklist + rotating playful micro-copy. Turns dead network latency into a
 * branded, on-DA ("Clinical Trust") experience.
 *
 * 100% JS: react-native Animated (native-driver transforms/opacity) + react-native-svg
 * (already in the native build) — ships over-the-air, no rebuild needed.
 */

const TARGET = 132;
const RING = 176;
const BEAM_H = 58;
const DOT = 10;

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Reading the recipe',
    steps: ['Reading the post', 'Spotting ingredients', 'Estimating portions', 'Crunching the macros'],
    captions: [
      'Counting the calories so you don’t have to 🧮',
      'Weighing every gram… virtually 🪶',
      'Stealing the chef’s secrets 🤫',
      'Turning a video into a real meal 🍱',
    ],
  },
  fr: {
    brand: 'MacroLens',
    title: 'Lecture de la recette',
    steps: ['Lecture du post', 'Repérage des ingrédients', 'Estimation des portions', 'Calcul des macros'],
    captions: [
      'On compte les calories à ta place 🧮',
      'On pèse chaque gramme… virtuellement 🪶',
      'On soutire les secrets du chef 🤫',
      'Une vidéo qui devient un vrai repas 🍱',
    ],
  },
};

type StepState = 'done' | 'active' | 'pending';

function StepRow({ label, state, activePulse }: { label: string; state: StepState; activePulse: Animated.Value }) {
  const scale = activePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const glow = activePulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
      <View style={{ alignItems: 'center', height: 20, justifyContent: 'center', width: 20 }}>
        {state === 'done' ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.accent, borderRadius: 999, height: 18, justifyContent: 'center', width: 18 }}>
            <Check color="#FFFFFF" size={12} strokeWidth={3} />
          </View>
        ) : state === 'active' ? (
          <Animated.View style={{ backgroundColor: colors.accent, borderRadius: 999, height: 11, opacity: glow, transform: [{ scale }], width: 11 }} />
        ) : (
          <View style={{ backgroundColor: colors.line2, borderRadius: 999, height: 9, width: 9 }} />
        )}
      </View>
      <Text
        style={{
          color: state === 'pending' ? colors.muted2 : colors.ink,
          fontFamily: fonts.mono,
          fontSize: typography.small,
          fontWeight: state === 'active' ? '700' : '500',
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function RecipeImportLoading({ platformLabel }: { platformLabel?: string | null }) {
  const { lang } = useLang();
  const t = STR[lang];

  const scan = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const activePulse = useRef(new Animated.Value(0)).current;
  const captionOpacity = useRef(new Animated.Value(1)).current;
  const macroDots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const [step, setStep] = useState(0);
  const [captionIdx, setCaptionIdx] = useState(0);

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [
      Animated.loop(Animated.timing(scan, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true })),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(activePulse, { toValue: 1, duration: 620, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(activePulse, { toValue: 0, duration: 620, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]),
      ),
      ...macroDots.map((value, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(value, { toValue: 1, duration: 520, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(value, { toValue: 0, duration: 520, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.delay(560 - index * 200),
          ]),
        ),
      ),
    ];

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [scan, spin, pulse, activePulse, macroDots]);

  useEffect(() => {
    const id = setInterval(() => setStep((current) => (current >= t.steps.length - 1 ? current : current + 1)), 1150);
    return () => clearInterval(id);
  }, [t.steps.length]);

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(captionOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setCaptionIdx((current) => (current + 1) % t.captions.length);
        Animated.timing(captionOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 2300);
    return () => clearInterval(id);
  }, [captionOpacity, t.captions.length]);

  const beamTranslate = scan.interpolate({ inputRange: [0, 1], outputRange: [-BEAM_H, TARGET] });
  const ringRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.5] });

  const macroColors = [colors.protein, colors.carbs, colors.fat];
  // Three points evenly placed on the ring (top, lower-right, lower-left).
  const center = RING / 2;
  const orbitRadius = RING / 2 - 7;
  const dotPositions = [-90, 30, 150].map((deg) => {
    const radians = (deg * Math.PI) / 180;
    return {
      left: center + orbitRadius * Math.cos(radians) - DOT / 2,
      top: center + orbitRadius * Math.sin(radians) - DOT / 2,
    };
  });

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

      {/* Hero: scanned target + orbiting macro dots */}
      <View style={{ alignItems: 'center', height: RING, justifyContent: 'center', marginTop: spacing.xl, width: RING }}>
        {/* Soft pulsing glow behind the target */}
        <Animated.View
          style={{
            backgroundColor: colors.accentWash,
            borderRadius: 999,
            height: TARGET + 26,
            opacity: glowOpacity,
            position: 'absolute',
            transform: [{ scale: glowScale }],
            width: TARGET + 26,
          }}
        />

        {/* Rotating dotted ring with orbiting macro dots */}
        <Animated.View style={{ height: RING, position: 'absolute', transform: [{ rotate: ringRotate }], width: RING }}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={center}
              cy={center}
              r={orbitRadius}
              fill="none"
              stroke={colors.accent}
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeDasharray="2 11"
              strokeLinecap="round"
            />
          </Svg>
          {dotPositions.map((position, index) => (
            <Animated.View
              key={`macro-${index}`}
              style={{
                backgroundColor: macroColors[index],
                borderRadius: 999,
                height: DOT,
                left: position.left,
                position: 'absolute',
                top: position.top,
                transform: [{ scale: macroDots[index].interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                width: DOT,
              }}
            />
          ))}
        </Animated.View>

        {/* The scanned target */}
        <View style={{ backgroundColor: colors.ink, borderRadius: radius.lg, height: TARGET, overflow: 'hidden', width: TARGET }}>
          {/* Reticle grid */}
          <Svg width={TARGET} height={TARGET} style={{ position: 'absolute' }}>
            {[0.33, 0.66].map((fraction) => (
              <Line key={`v-${fraction}`} x1={TARGET * fraction} y1={0} x2={TARGET * fraction} y2={TARGET} stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={1} />
            ))}
            {[0.33, 0.66].map((fraction) => (
              <Line key={`h-${fraction}`} x1={0} y1={TARGET * fraction} x2={TARGET} y2={TARGET * fraction} stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={1} />
            ))}
          </Svg>

          {/* Faint brand mark at the core */}
          <View style={{ alignItems: 'center', height: TARGET, justifyContent: 'center', width: TARGET }}>
            <Text style={{ color: 'rgba(255,255,255,0.16)', fontFamily: fonts.display, fontSize: 52, fontWeight: '700', letterSpacing: -2 }}>ML</Text>
          </View>

          {/* Sweeping scan beam */}
          <Animated.View style={{ height: BEAM_H, left: 0, position: 'absolute', right: 0, transform: [{ translateY: beamTranslate }] }}>
            <Svg width={TARGET} height={BEAM_H}>
              <Defs>
                <LinearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.accent} stopOpacity="0" />
                  <Stop offset="0.5" stopColor={colors.accent} stopOpacity="0.5" />
                  <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect width={TARGET} height={BEAM_H} fill="url(#beam)" />
              <Rect x={0} y={BEAM_H / 2 - 1} width={TARGET} height={2} fill={colors.accent} opacity={0.95} />
            </Svg>
          </Animated.View>
        </View>
      </View>

      {/* Title + rotating playful caption */}
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl + spacing.sm }}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 23, fontWeight: '700', letterSpacing: -0.4 }}>{t.title}</Text>
        <Animated.Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: typography.small, letterSpacing: 0.1, opacity: captionOpacity, textAlign: 'center' }}>
          {t.captions[captionIdx]}
        </Animated.Text>
      </View>

      {/* Staged analysis checklist */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: radius.lg,
          borderWidth: 1,
          gap: spacing.md,
          marginTop: spacing.xl + spacing.sm,
          padding: spacing.lg,
          width: '100%',
        }}
      >
        {t.steps.map((label, index) => (
          <StepRow
            key={label}
            label={label}
            state={index < step ? 'done' : index === step ? 'active' : 'pending'}
            activePulse={activePulse}
          />
        ))}
      </View>
    </View>
  );
}
