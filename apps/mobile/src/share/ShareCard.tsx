import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../ui/theme';
import { MACROLENS_APP_STORE_URL, macroBarSegments, type ShareCardData } from './shareCardContent';

/**
 * Branded, share-worthy "Story" card (9:16) — direction A "Cinematic", matching
 * apps/mobile/design/macrolens-share-card-final.html. Rendered off-screen and
 * captured to an image by the native build (react-native-view-shot). English copy.
 *
 */

const LIGHT_ACCENT = '#67E0AD';
const SCRIM = '#0A0706';

type Props = {
  data: ShareCardData;
  /** Logical width; height follows a 9:16 ratio. Bump for higher-res capture. */
  width?: number;
};

function AppStoreQr({ size }: { size: number }) {
  const qrSize = Math.max(24, size - 12);

  return (
    <View style={{ alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 9, height: size, justifyContent: 'center', width: size }}>
      <QRCode
        value={MACROLENS_APP_STORE_URL}
        size={qrSize}
        color={colors.ink}
        backgroundColor="#FFFFFF"
        ecl="M"
        quietZone={0}
      />
    </View>
  );
}

function Chip({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
      <View style={{ backgroundColor: color, borderRadius: 2, height: 7, width: 7 }} />
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: 11, fontWeight: '500' }}>
        {value} <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</Text>
      </Text>
    </View>
  );
}

function ProgressStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: 22, fontWeight: '600' }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.58)', fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.5, marginTop: 4, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

export const ShareCard = forwardRef<View, Props>(function ShareCard({ data, width = 360 }, ref) {
  const height = Math.round(width * (16 / 9));
  const segments = macroBarSegments(data.macros);
  const round = (value: number) => Math.round(value);
  const isProgress = data.kind === 'progress' && data.progress;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ backgroundColor: SCRIM, borderRadius: 30, height, overflow: 'hidden', width }}
    >
      {/* Background: real photo, else warm gradient */}
      {data.imageUrl ? (
        <Image source={{ uri: data.imageUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={isProgress ? '#1C8B68' : '#D27A36'} />
              <Stop offset="0.55" stopColor={isProgress ? '#184C4A' : '#A8431F'} />
              <Stop offset="1" stopColor={isProgress ? '#171717' : '#5C241A'} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bg)" />
        </Svg>
      )}

      {/* Bottom scrim for legibility */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={SCRIM} stopOpacity="0.95" />
            <Stop offset="0.5" stopColor={SCRIM} stopOpacity="0.74" />
            <Stop offset="1" stopColor={SCRIM} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scrim)" />
      </Svg>

      {/* Content */}
      <View style={{ bottom: 0, left: 0, padding: width * 0.061, paddingBottom: width * 0.05, position: 'absolute', right: 0 }}>
        <Text style={{ color: LIGHT_ACCENT, fontFamily: fonts.mono, fontSize: 10, fontWeight: '500', letterSpacing: 1.6, textTransform: 'uppercase' }}>
          {data.eyebrow}
        </Text>
        <Text style={{ color: '#FFFFFF', fontFamily: fonts.display, fontSize: width * 0.082, fontWeight: '600', letterSpacing: -0.7, lineHeight: width * 0.088, marginTop: 9 }}>
          {data.title}
        </Text>

        {isProgress ? (
          <View style={{ gap: 16, marginTop: width * 0.066 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ProgressStat value={`${data.progress?.streakDays ?? 0}`} label="day streak" />
              <ProgressStat value={data.progress?.weightKg ? `${round(data.progress.weightKg)}kg` : '--'} label="weight" />
              <ProgressStat value={`${round(data.calories)}`} label="kcal today" />
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <View style={{ backgroundColor: LIGHT_ACCENT, height: 8, width: `${data.progress?.calorieProgressPct ?? 0}%` }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.62)', fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {round(data.progress?.calorieProgressPct ?? 0)}% calorie target
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* kcal - generous breathing room above */}
            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 10, marginTop: width * 0.066 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: width * 0.13, fontWeight: '500', letterSpacing: -1.4, lineHeight: width * 0.12 }}>
                {round(data.calories)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.66)', fontFamily: fonts.mono, fontSize: 12, marginBottom: 6 }}>kcal</Text>
            </View>

            {/* Macro bar */}
            <View style={{ borderRadius: 999, flexDirection: 'row', gap: 2, height: 7, marginTop: width * 0.05, overflow: 'hidden' }}>
              <View style={{ backgroundColor: colors.protein, width: `${segments.proteinPct}%` }} />
              <View style={{ backgroundColor: colors.carbs, width: `${segments.carbsPct}%` }} />
              <View style={{ backgroundColor: colors.fat, width: `${segments.fatPct}%` }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
              <Chip color={colors.protein} value={`${round(data.macros.proteinG)}g`} label="protein" />
              <Chip color={colors.carbs} value={`${round(data.macros.carbsG)}g`} label="carbs" />
              <Chip color={colors.fat} value={`${round(data.macros.fatG)}g`} label="fat" />
            </View>
          </>
        )}

        {/* Brand + App Store QR */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', height: 1, marginVertical: width * 0.05 }} />
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
          <AppStoreQr size={width * 0.13} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: fonts.display, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }}>MacroLens</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.6, marginTop: 2, textTransform: 'uppercase' }}>
              Scan → get the app
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});
