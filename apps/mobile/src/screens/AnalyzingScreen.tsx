import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Eyebrow } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

type Props = {
  imageUri: string;
};

const STR = {
  en: {
    metaboProof: 'MetaboProof',
    title: 'Analysis in progress',
    subtitle: 'Verifying each ingredient',
    steps: ['Food recognition', 'Portion sizing', 'Macro & margin calculation', 'MetaboProof level'],
  },
  fr: {
    metaboProof: 'MetaboProof',
    title: 'Analyse en cours',
    subtitle: 'Vérification de chaque ingrédient',
    steps: ['Reconnaissance des aliments', 'Estimation des portions', 'Calcul des macros et marge', 'Niveau de preuve MetaboProof'],
  },
};

function Spinner({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { duration: 800, easing: Easing.linear, toValue: 1, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ borderColor: 'rgba(255,255,255,0.35)', borderRadius: size / 2, borderTopColor: color, borderWidth: 2, height: size, transform: [{ rotate }], width: size }} />;
}

export function AnalyzingScreen({ imageUri }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isSynthetic =
    imageUri.startsWith('manual://') ||
    imageUri.startsWith('barcode://') ||
    imageUri.startsWith('product://') ||
    imageUri.startsWith('recipe://') ||
    imageUri.startsWith('calibration://');

  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((current) => Math.min(current + 1, t.steps.length - 1)), 850);
    return () => clearInterval(id);
  }, [t.steps.length]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 950, easing: Easing.inOut(Easing.quad), toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 950, easing: Easing.inOut(Easing.quad), toValue: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          {isSynthetic ? (
            <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 24, borderWidth: 1, height: 128, justifyContent: 'center', width: 128 }}>
              <Check color={colors.accentInk} size={44} strokeWidth={2} />
            </View>
          ) : (
            <Image source={{ uri: imageUri }} resizeMode="cover" style={{ backgroundColor: colors.paper2, borderRadius: 24, height: 128, width: 128 }} />
          )}
        </Animated.View>
        <Eyebrow style={{ marginTop: spacing.lg }}>{t.metaboProof}</Eyebrow>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.3, marginTop: 2, textAlign: 'center' }}>{t.title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, textAlign: 'center' }}>{t.subtitle}</Text>
      </View>

      <View style={{ gap: spacing.lg, marginTop: spacing.xxl, paddingHorizontal: spacing.sm }}>
        {t.steps.map((label, index) => {
          const state = index < step ? 'done' : index === step ? 'active' : 'idle';
          return (
            <View key={label} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, opacity: state === 'idle' ? 0.4 : 1 }}>
              <View style={{ alignItems: 'center', backgroundColor: state === 'done' ? colors.accent : state === 'active' ? colors.ink : colors.paper3, borderRadius: radius.pill, height: 24, justifyContent: 'center', width: 24 }}>
                {state === 'done' ? <Check color="#FFFFFF" size={14} strokeWidth={2.6} /> : state === 'active' ? <Spinner /> : null}
              </View>
              <Text style={{ color: state === 'idle' ? colors.muted : colors.ink, flex: 1, fontSize: typography.body, fontWeight: state === 'done' ? '600' : '500' }}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
