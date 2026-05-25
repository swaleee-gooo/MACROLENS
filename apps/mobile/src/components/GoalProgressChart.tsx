import { Text, View } from 'react-native';
import type { GoalProgress } from '../domain/goalProgress';
import { InteractiveLineChart } from './InteractiveLineChart';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  progress: GoalProgress;
};

export function GoalProgressChart({ progress }: Props) {
  let latestLoggedIndex = progress.points.length - 1;
  for (let index = progress.points.length - 1; index >= 0; index -= 1) {
    if (progress.points[index].logged) {
      latestLoggedIndex = index;
      break;
    }
  }
  const chartPoints = progress.points.map((point) => ({
    id: point.isoDate,
    label: point.label,
    value: point.weightKg,
    detail: point.logged ? `${point.calories} kcal loggees` : progress.insight,
    highlighted: point.logged,
  }));

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Goal Progress</Text>
        <View style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900' }}>{progress.statusLabel}</Text>
        </View>
      </View>

      <InteractiveLineChart
        emptyLabel="Log tes repas pour afficher ta courbe."
        initialSelectedIndex={latestLoggedIndex}
        points={chartPoints}
        targetValue={progress.targetWeightKg}
        unit="kg"
      />
    </View>
  );
}
