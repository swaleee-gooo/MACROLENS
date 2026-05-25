import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { GoalProgress } from '../domain/goalProgress';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  progress: GoalProgress;
};

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function GoalProgressChart({ progress }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, Math.min(360, width - spacing.xl * 4));
  const chartHeight = 180;
  const paddingX = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const values = progress.points.map((point) => point.weightKg);
  const rawMin = Math.min(...values, progress.targetWeightKg ?? progress.currentWeightKg);
  const rawMax = Math.max(...values, progress.targetWeightKg ?? progress.currentWeightKg);
  const range = Math.max(1, rawMax - rawMin);
  const minY = rawMin - range * 0.18;
  const maxY = rawMax + range * 0.18;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const xStep = progress.points.length > 1 ? (chartWidth - paddingX * 2) / (progress.points.length - 1) : 0;

  function yForValue(value: number): number {
    return paddingTop + ((maxY - value) / (maxY - minY)) * plotHeight;
  }

  const linePoints = progress.points.map((point, index) => ({
    x: paddingX + xStep * index,
    y: yForValue(point.weightKg),
  }));
  const path = buildLinePath(linePoints);
  let latestLoggedIndex = progress.points.length - 1;
  for (let index = progress.points.length - 1; index >= 0; index -= 1) {
    if (progress.points[index].logged) {
      latestLoggedIndex = index;
      break;
    }
  }
  const activeIndex = Math.min(selectedIndex ?? latestLoggedIndex, progress.points.length - 1);
  const activePoint = linePoints[activeIndex] ?? linePoints[linePoints.length - 1];
  const activeProgressPoint = progress.points[activeIndex] ?? progress.points[progress.points.length - 1];
  const activeWeight = activeProgressPoint?.weightKg ?? progress.currentWeightKg;
  const targetY = progress.targetWeightKg ? yForValue(progress.targetWeightKg) : null;
  const firstPoint = progress.points[0];
  const middlePoint = progress.points[Math.floor(progress.points.length / 2)];
  const lastPoint = progress.points[progress.points.length - 1];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Goal Progress</Text>
        <View style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900' }}>{progress.statusLabel}</Text>
        </View>
      </View>

      <View style={{ height: chartHeight, position: 'relative', width: chartWidth }}>
        <Svg height={chartHeight} width={chartWidth}>
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = paddingTop + plotHeight * ratio;
            return <Line key={ratio} x1={paddingX} x2={chartWidth - paddingX} y1={y} y2={y} stroke={colors.line} strokeDasharray="3 5" strokeWidth={1} />;
          })}
          {targetY ? <Line x1={paddingX} x2={chartWidth - paddingX} y1={targetY} y2={targetY} stroke={colors.greenSoft} strokeDasharray="6 5" strokeWidth={2} /> : null}
          <Path d={path} fill="none" stroke={colors.black} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          <Path d={path} fill="none" stroke={colors.greenSoft} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} />
          {progress.points.map((point, index) =>
            point.logged ? <Circle key={point.isoDate} cx={linePoints[index].x} cy={linePoints[index].y} fill={colors.greenSoft} r={3.5} stroke={colors.green} strokeWidth={1.5} /> : null,
          )}
          <Circle cx={activePoint.x} cy={activePoint.y} fill={colors.surface} r={6} stroke={colors.green} strokeWidth={3} />
          <SvgText fill={colors.muted} fontSize={11} fontWeight="700" x={paddingX} y={chartHeight - 8}>
            {firstPoint.label}
          </SvgText>
          <SvgText fill={colors.muted} fontSize={11} fontWeight="700" textAnchor="middle" x={chartWidth / 2} y={chartHeight - 8}>
            {middlePoint.label}
          </SvgText>
          <SvgText fill={colors.muted} fontSize={11} fontWeight="700" textAnchor="end" x={chartWidth - paddingX} y={chartHeight - 8}>
            {lastPoint.label}
          </SvgText>
        </Svg>
        <View style={{ bottom: paddingBottom, flexDirection: 'row', left: paddingX, position: 'absolute', right: paddingX, top: 0 }}>
          {progress.points.map((point, index) => (
            <Pressable key={`touch-${point.isoDate}`} onPress={() => setSelectedIndex(index)} style={{ flex: 1 }} />
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: colors.black, borderRadius: radius.md, gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>
          {activeWeight} kg - {activeProgressPoint.label}
        </Text>
        <Text style={{ color: '#EDEDED', fontSize: typography.tiny, fontWeight: '800' }}>
          {activeProgressPoint.logged ? `${activeProgressPoint.calories} kcal loggees` : progress.insight}
        </Text>
      </View>
    </View>
  );
}
