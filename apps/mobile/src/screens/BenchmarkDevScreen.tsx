import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, BarChart3 } from 'lucide-react-native';
import { evaluateBenchmarkCases, generateBenchmarkMarkdown, type BenchmarkMethod } from '../metaboproof/benchmarkEngine';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
};

const methodLabels: Record<BenchmarkMethod, string> = {
  baselinePhotoOnly: 'Photo baseline',
  calibratedUser: 'Calibrated user',
  verifiedWeight: 'Verified weight',
};

const report = evaluateBenchmarkCases([
  {
    id: 'N5K-local-1',
    groundTruth: { kcal: 500, massGrams: 420 },
    predictions: {
      baselinePhotoOnly: { kcal: 620, massGrams: 500, kcalRange: { min: 430, max: 690 } },
      calibratedUser: { kcal: 540, massGrams: 440, kcalRange: { min: 480, max: 590 } },
      verifiedWeight: { kcal: 500, massGrams: 420, kcalRange: { min: 500, max: 500 } },
    },
  },
  {
    id: 'N5K-local-2',
    groundTruth: { kcal: 800, massGrams: 610 },
    predictions: {
      baselinePhotoOnly: { kcal: 680, massGrams: 540, kcalRange: { min: 520, max: 760 } },
      calibratedUser: { kcal: 760, massGrams: 590, kcalRange: { min: 700, max: 830 } },
      verifiedWeight: { kcal: 800, massGrams: 610, kcalRange: { min: 800, max: 800 } },
    },
  },
]);

function MetricRow({ method }: { method: BenchmarkMethod }) {
  const metrics = report.metrics[method];
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, gap: spacing.xs, padding: spacing.md }}>
      <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{methodLabels[method]}</Text>
      <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>MAE {metrics.maeKcal} kcal | MAPE {metrics.mapeKcal}% | mass error {metrics.meanMassErrorGrams}g | coverage {metrics.intervalCoverage}%</Text>
    </View>
  );
}

export function BenchmarkDevScreen({ onBack }: Props) {
  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Back</Text>
      </Pressable>

      <View style={{ alignItems: 'center', backgroundColor: colors.blueSoft, borderRadius: radius.pill, height: 64, justifyContent: 'center', width: 64 }}>
        <BarChart3 color={colors.blue} size={30} strokeWidth={2.5} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Benchmark/dev</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 20 }}>Local Nutrition5k-style metrics compare photo baseline, calibrated user, and verified weight methods before any public claim.</Text>
      </View>

      <MetricRow method="baselinePhotoOnly" />
      <MetricRow method="calibratedUser" />
      <MetricRow method="verifiedWeight" />

      <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Markdown report</Text>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', lineHeight: 17, marginTop: spacing.sm }}>{generateBenchmarkMarkdown(report)}</Text>
      </View>
    </ScrollView>
  );
}
