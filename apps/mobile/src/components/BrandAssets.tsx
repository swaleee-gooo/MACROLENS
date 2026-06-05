import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../ui/theme';

type AssetProps = {
  width?: number;
  height?: number;
};

export function MacroLensMark({ width = 54, height = 54 }: AssetProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 54 54">
      <Rect x={3} y={3} width={48} height={48} rx={16} fill={colors.black} />
      <Circle cx={27} cy={27} r={15} fill={colors.greenSoft} />
      <Circle cx={27} cy={27} r={8} fill={colors.green} />
      <Path d="M19 17h16M17 35h20" stroke="white" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function MealScanAsset({ width = 300, height = 220 }: AssetProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 300 220">
      <Rect width={300} height={220} rx={26} fill="#F6F5EF" />
      <Rect x={20} y={22} width={260} height={176} rx={22} fill={colors.black} />
      <Rect x={35} y={36} width={230} height={146} rx={19} fill="#F3EEE5" />
      <Circle cx={138} cy={108} r={64} fill="#FFFDF7" />
      <Circle cx={138} cy={108} r={49} fill="#F2ECE1" />
      <Path d="M106 91c19-20 54-18 72 7-12 7-25 11-39 11-12 0-23-6-33-18z" fill="#F1B869" />
      <Path d="M101 124c20-9 47-8 71 7-8 15-23 24-42 24-17 0-27-9-29-31z" fill={colors.greenSoft} />
      <Path d="M119 112c8-9 26-12 43-4 1 14-8 23-23 24-13 0-21-7-20-20z" fill="#6C3D23" />
      <Circle cx={103} cy={110} r={15} fill="#FFFFFF" />
      <Circle cx={103} cy={110} r={7} fill={colors.amber} />
      <Rect x={52} y={54} width={42} height={5} rx={3} fill="white" opacity={0.78} />
      <Rect x={52} y={66} width={28} height={5} rx={3} fill="white" opacity={0.44} />
      <Rect x={202} y={56} width={44} height={10} rx={5} fill={colors.greenSoft} />
      <Rect x={199} y={141} width={50} height={7} rx={4} fill={colors.green} />
      <Rect x={199} y={155} width={38} height={7} rx={4} fill={colors.blue} />
      <Rect x={199} y={169} width={30} height={7} rx={4} fill={colors.amber} />
      <Line x1={62} y1={82} x2={238} y2={82} stroke={colors.green} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      <Path d="M54 61v-20h24M222 41h24v20M246 159v20h-24M78 179H54v-20" stroke="white" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MacroPlanAsset({ width = 300, height = 180 }: AssetProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 300 180">
      <Rect width={300} height={180} rx={26} fill="#F6F5EF" />
      <Rect x={22} y={24} width={116} height={132} rx={22} fill={colors.black} />
      <Circle cx={80} cy={82} r={38} fill="#1E2D22" />
      <Path d="M80 44a38 38 0 1 1-31 60" stroke={colors.green} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Circle cx={80} cy={82} r={20} fill={colors.greenSoft} />
      <Rect x={48} y={129} width={64} height={8} rx={4} fill={colors.greenSoft} />
      <Rect x={156} y={28} width={120} height={34} rx={17} fill={colors.greenSoft} />
      <Rect x={174} y={42} width={52} height={6} rx={3} fill={colors.green} />
      <Rect x={156} y={78} width={120} height={18} rx={9} fill={colors.surfaceMuted} />
      <Rect x={156} y={78} width={90} height={18} rx={9} fill={colors.protein} />
      <Rect x={156} y={110} width={120} height={18} rx={9} fill={colors.surfaceMuted} />
      <Rect x={156} y={110} width={72} height={18} rx={9} fill={colors.carbs} />
      <Rect x={156} y={142} width={120} height={18} rx={9} fill={colors.surfaceMuted} />
      <Rect x={156} y={142} width={54} height={18} rx={9} fill={colors.fat} />
      <Circle cx={162} cy={45} r={5} fill={colors.green} />
      <Circle cx={272} cy={45} r={5} fill={colors.green} />
    </Svg>
  );
}

export function ManualMealAsset({ width = 150, height = 130 }: AssetProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 150 130">
      <Rect x={6} y={12} width={138} height={106} rx={22} fill="#F6F5EF" />
      <Rect x={26} y={22} width={68} height={88} rx={14} fill={colors.surface} stroke={colors.line} strokeWidth={2} />
      <Rect x={40} y={38} width={38} height={7} rx={4} fill={colors.black} />
      <Rect x={40} y={55} width={30} height={5} rx={3} fill={colors.line} />
      <Rect x={40} y={69} width={38} height={5} rx={3} fill={colors.line} />
      <Rect x={40} y={83} width={24} height={5} rx={3} fill={colors.line} />
      <Circle cx={103} cy={75} r={28} fill={colors.greenSoft} />
      <Path d="M91 76l8 8 18-22" stroke={colors.green} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={40} cy={26} r={5} fill={colors.green} />
      <Circle cx={80} cy={108} r={5} fill={colors.amber} />
    </Svg>
  );
}

export function ProductLabelAsset({ width = 150, height = 130 }: AssetProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 150 130">
      <Rect x={7} y={12} width={136} height={106} rx={22} fill="#F6F5EF" />
      <Rect x={30} y={22} width={90} height={86} rx={12} fill={colors.surface} stroke={colors.line} strokeWidth={2} />
      <Rect x={43} y={36} width={54} height={7} rx={4} fill={colors.black} />
      <Rect x={43} y={53} width={64} height={5} rx={3} fill={colors.line} />
      <Rect x={43} y={66} width={50} height={5} rx={3} fill={colors.line} />
      <Rect x={43} y={79} width={58} height={5} rx={3} fill={colors.line} />
      <G>
        <Rect x={44} y={94} width={4} height={12} rx={2} fill={colors.black} />
        <Rect x={52} y={94} width={2} height={12} rx={1} fill={colors.black} />
        <Rect x={59} y={94} width={5} height={12} rx={2} fill={colors.black} />
        <Rect x={69} y={94} width={2} height={12} rx={1} fill={colors.black} />
        <Rect x={75} y={94} width={7} height={12} rx={2} fill={colors.black} />
        <Rect x={87} y={94} width={3} height={12} rx={1.5} fill={colors.black} />
        <Rect x={95} y={94} width={5} height={12} rx={2} fill={colors.black} />
      </G>
      <Circle cx={114} cy={34} r={15} fill={colors.greenSoft} />
      <Path d="M107 34l5 5 10-13" stroke={colors.green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function ScannerPermissionAsset({ width = 260, height = 190 }: AssetProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 260 190">
      <Rect width={260} height={190} rx={28} fill="#F6F5EF" />
      <Rect x={39} y={35} width={182} height={120} rx={24} fill={colors.black} />
      <Rect x={56} y={52} width={148} height={86} rx={18} fill="#1E2D22" />
      <Circle cx={130} cy={95} r={29} fill={colors.greenSoft} />
      <Circle cx={130} cy={95} r={15} fill={colors.green} />
      <Circle cx={178} cy={67} r={8} fill={colors.greenSoft} />
      <Path d="M77 76v-12h18M165 64h18v12M183 114v12h-18M95 126H77v-12" stroke="white" strokeWidth={4} strokeLinecap="round" />
      <Rect x={70} y={161} width={52} height={10} rx={5} fill={colors.green} />
      <Rect x={134} y={161} width={52} height={10} rx={5} fill={colors.blue} />
    </Svg>
  );
}

type StateVariant = 'success' | 'error' | 'privacy' | 'empty';

export function StateSignalAsset({ variant, width = 150, height = 130 }: AssetProps & { variant: StateVariant }) {
  const isSuccess = variant === 'success';
  const isError = variant === 'error';
  const isPrivacy = variant === 'privacy';
  const accent = isSuccess || isPrivacy ? colors.green : isError ? colors.amber : colors.blue;
  const soft = isSuccess || isPrivacy ? colors.greenSoft : isError ? colors.amberSoft : colors.blueSoft;

  return (
    <Svg width={width} height={height} viewBox="0 0 150 130">
      <Rect x={8} y={12} width={134} height={106} rx={24} fill="#F6F5EF" />
      <Circle cx={75} cy={65} r={40} fill={soft} />
      {isPrivacy ? (
        <Path d="M75 35l28 12v17c0 20-12 32-28 40-16-8-28-20-28-40V47l28-12z" fill={colors.surface} stroke={accent} strokeWidth={5} strokeLinejoin="round" />
      ) : isError ? (
        <G>
          <Path d="M75 32l39 70H36L75 32z" fill={colors.surface} stroke={accent} strokeWidth={5} strokeLinejoin="round" />
          <Line x1={75} y1={56} x2={75} y2={78} stroke={accent} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={75} cy={91} r={4} fill={accent} />
        </G>
      ) : isSuccess ? (
        <Path d="M53 66l15 15 31-37" stroke={accent} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <G>
          <Ellipse cx={75} cy={72} rx={36} ry={20} fill={colors.surface} stroke={accent} strokeWidth={5} />
          <Circle cx={57} cy={66} r={7} fill={colors.greenSoft} />
          <Circle cx={75} cy={60} r={8} fill={colors.amberSoft} />
          <Circle cx={93} cy={67} r={7} fill={colors.blueSoft} />
        </G>
      )}
      {isPrivacy ? <Path d="M64 66l8 8 16-19" stroke={accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
    </Svg>
  );
}
