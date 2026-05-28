import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { CheckCircle2, ScanLine, Sparkles } from 'lucide-react-native';
import { buildAnalysisAnimationStages } from '../domain/analysisAnimation';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  imageUri: string;
};

export function AnalyzingScreen({ imageUri }: Props) {
  const isSynthetic = imageUri.startsWith('manual://') || imageUri.startsWith('barcode://');
  const stages = useMemo(() => buildAnalysisAnimationStages(), []);
  const [stageIndex, setStageIndex] = useState(0);
  const scanProgress = useRef(new Animated.Value(0)).current;
  const pulseProgress = useRef(new Animated.Value(0)).current;
  const currentStage = stages[stageIndex] ?? stages[0];
  const scanTranslateY = scanProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 292] });
  const pulseScale = pulseProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulseProgress.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] });
  const visibleProgress = Math.max(currentStage.progress, 24);

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, { duration: 1350, easing: Easing.inOut(Easing.quad), toValue: 1, useNativeDriver: true }),
        Animated.timing(scanProgress, { duration: 0, toValue: 0, useNativeDriver: true }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseProgress, { duration: 760, easing: Easing.out(Easing.quad), toValue: 1, useNativeDriver: true }),
        Animated.timing(pulseProgress, { duration: 760, easing: Easing.in(Easing.quad), toValue: 0, useNativeDriver: true }),
      ]),
    );

    scanLoop.start();
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, [pulseProgress, scanProgress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((current) => (current + 1) % stages.length);
    }, 1180);

    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>MACROLENS</Text>
        <View style={{ alignItems: 'center', borderColor: colors.greenSoft, borderRadius: radius.pill, borderWidth: 12, height: 146, justifyContent: 'center', width: 146 }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>{visibleProgress}%</Text>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>Analyse</Text>
        </View>
      </View>

      <View style={{ aspectRatio: 1.05, borderRadius: radius.lg, marginTop: spacing.xl, overflow: 'hidden', width: '100%' }}>
        {isSynthetic ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.black, flex: 1, justifyContent: 'center' }}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <ScanLine color={colors.greenSoft} size={88} strokeWidth={1.9} />
            </Animated.View>
          </View>
        ) : (
          <Image source={{ uri: imageUri }} style={{ height: '100%', width: '100%' }} />
        )}
        <Animated.View style={{ backgroundColor: colors.greenSoft, height: 4, left: 0, opacity: 0.95, position: 'absolute', right: 0, top: 20, transform: [{ translateY: scanTranslateY }] }} />
        <View style={{ backgroundColor: 'rgba(5,5,5,0.22)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
        <View style={{ alignItems: 'center', bottom: spacing.lg, gap: spacing.sm, left: spacing.lg, position: 'absolute', right: spacing.lg }}>
          <View style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Sparkles color={colors.green} size={16} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>Analyse IA en cours</Text>
          </View>
        </View>
      </View>
      <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900', textAlign: 'center' }}>{currentStage.label}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 23, textAlign: 'center' }}>{currentStage.detail}</Text>
        </View>
        <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 12, overflow: 'hidden' }}>
          <View style={{ backgroundColor: colors.green, borderRadius: radius.pill, height: 12, width: `${currentStage.progress}%` }} />
        </View>
        <View style={{ gap: spacing.sm }}>
          {stages.map((stage, index) => (
            <View key={stage.label} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <CheckCircle2 color={index <= stageIndex ? colors.green : colors.line} size={17} strokeWidth={2.4} />
              <Text style={{ color: index <= stageIndex ? colors.black : colors.muted, flex: 1, fontSize: typography.small, fontWeight: '900' }}>{stage.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
