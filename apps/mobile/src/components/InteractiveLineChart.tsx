import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { buildProgressChartViewModel, type ProgressChartPointInput } from '../ui/progressChartViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  points: ProgressChartPointInput[];
  unit: string;
  emptyLabel: string;
  initialSelectedIndex?: number | null;
  targetValue?: number | null;
};

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function InteractiveLineChart({ points, unit, emptyLabel, initialSelectedIndex = null, targetValue = null }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(initialSelectedIndex);
  const { width } = useWindowDimensions();
  const pointsKey = useMemo(() => points.map((point) => point.id).join('|'), [points]);
  const viewModel = buildProgressChartViewModel(points, selectedIndex, unit);
  const chartWidth = Math.max(280, Math.min(360, width - spacing.xl * 4));
  const chartHeight = 180;
  const paddingX = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  useEffect(() => {
    setSelectedIndex(initialSelectedIndex);
  }, [initialSelectedIndex, pointsKey]);

  if (viewModel.isEmpty) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, minHeight: chartHeight, justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', textAlign: 'center' }}>{emptyLabel}</Text>
      </View>
    );
  }

  const values = targetValue !== null ? [...points.map((point) => point.value), targetValue] : points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = Math.max(1, rawMax - rawMin);
  const minY = rawMin - range * 0.18;
  const maxY = rawMax + range * 0.18;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const xStep = points.length > 1 ? (chartWidth - paddingX * 2) / (points.length - 1) : 0;

  function yForValue(value: number): number {
    return paddingTop + ((maxY - value) / (maxY - minY)) * plotHeight;
  }

  const linePoints = points.map((point, index) => ({
    x: paddingX + xStep * index,
    y: yForValue(point.value),
  }));
  const activeIndex = Math.max(0, Math.min(selectedIndex ?? points.length - 1, points.length - 1));
  const activePoint = linePoints[activeIndex] ?? linePoints[linePoints.length - 1];
  const targetY = targetValue !== null ? yForValue(targetValue) : null;
  const firstPoint = points[0];
  const middlePoint = points[Math.floor(points.length / 2)];
  const lastPoint = points[points.length - 1];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ height: chartHeight, position: 'relative', width: chartWidth }}>
        <Svg height={chartHeight} width={chartWidth}>
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = paddingTop + plotHeight * ratio;
            return <Line key={ratio} x1={paddingX} x2={chartWidth - paddingX} y1={y} y2={y} stroke={colors.line} strokeDasharray="3 5" strokeWidth={1} />;
          })}
          {targetY !== null ? <Line x1={paddingX} x2={chartWidth - paddingX} y1={targetY} y2={targetY} stroke={colors.greenSoft} strokeDasharray="6 5" strokeWidth={2} /> : null}
          <Path d={buildLinePath(linePoints)} fill="none" stroke={colors.black} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          <Path d={buildLinePath(linePoints)} fill="none" stroke={colors.greenSoft} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} />
          {points.map((point, index) =>
            point.highlighted ? <Circle key={point.id} cx={linePoints[index].x} cy={linePoints[index].y} fill={colors.greenSoft} r={3.5} stroke={colors.green} strokeWidth={1.5} /> : null,
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
          {points.map((point, index) => (
            <Pressable key={`touch-${point.id}`} onPress={() => setSelectedIndex(index)} style={{ flex: 1 }} />
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: colors.black, borderRadius: radius.md, gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>
          {viewModel.selected.valueLabel} - {viewModel.selected.label}
        </Text>
        <Text style={{ color: '#EDEDED', fontSize: typography.tiny, fontWeight: '800' }}>{viewModel.selected.detail}</Text>
      </View>
    </View>
  );
}
