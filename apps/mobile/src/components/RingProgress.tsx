import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../ui/theme';

type Props = {
  size: number;
  strokeWidth: number;
  progress: number;
  color?: string;
  label: string;
  detail: string;
};

export function RingProgress({ size, strokeWidth, progress, color = colors.black, label, detail }: Props) {
  const ringRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const clamped = Math.max(0, Math.min(progress, 100));
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} r={ringRadius} stroke={colors.surfaceMuted} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ringRadius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', position: 'absolute' }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{detail}</Text>
      </View>
    </View>
  );
}
