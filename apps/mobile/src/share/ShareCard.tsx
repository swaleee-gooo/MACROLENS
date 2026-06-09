import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../ui/theme';
import { MACROLENS_APP_STORE_URL, macroBarSegments, type ShareCardData } from './shareCardContent';

/**
 * Branded, share-worthy "Story" card (9:16) — direction A "Cinematic", matching
 * apps/mobile/design/macrolens-share-card-final.html, but tuned BOLD for full-screen
 * Stories: huge type, big hero number, large macros. Every size is a fraction of
 * `width` so it scales identically at the 360 preview and the 1080 capture.
 */

const BASE = 360;
const LIGHT_ACCENT = '#67E0AD';
const SCRIM = '#0A0706';

type Props = {
  data: ShareCardData;
  /** Logical width; height follows 9:16. Captured at 1080 for Stories. */
  width?: number;
};

function AppStoreQr({ size }: { size: number }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: size * 0.18, height: size, justifyContent: 'center', width: size }}>
      <QRCode value={MACROLENS_APP_STORE_URL} size={Math.max(24, size * 0.84)} color={colors.ink} backgroundColor="#FFFFFF" ecl="M" quietZone={0} />
    </View>
  );
}

function MacroCol({ color, label, grams, u }: { color: string; label: string; grams: string; u: (frac: number) => number }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: u(0.016) }}>
        <View style={{ backgroundColor: color, borderRadius: u(0.007), height: u(0.024), width: u(0.024) }} />
        <Text style={{ color: 'rgba(255,255,255,0.62)', fontFamily: fonts.mono, fontSize: u(0.03), fontWeight: '500', letterSpacing: u(0.0015), textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: u(0.072), fontWeight: '600', letterSpacing: -u(0.001), marginTop: u(0.018) }}>{grams}</Text>
    </View>
  );
}

function ProgressStat({ value, label, u }: { value: string; label: string; u: (frac: number) => number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.mono, fontSize: u(0.085), fontWeight: '600', letterSpacing: -u(0.002) }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fonts.mono, fontSize: u(0.03), fontWeight: '500', letterSpacing: u(0.0015), marginTop: u(0.012), textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

export const ShareCard = forwardRef<View, Props>(function ShareCard({ data, width = BASE }, ref) {
  const u = (frac: number) => width * frac;
  const height = Math.round(width * (16 / 9));
  const segments = macroBarSegments(data.macros);
  const round = (value: number) => Math.round(value);
  const isProgress = data.kind === 'progress' && Boolean(data.progress);

  return (
    <View ref={ref} collapsable={false} style={{ backgroundColor: SCRIM, borderRadius: u(0.083), height, overflow: 'hidden', width }}>
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

      {/* Strong bottom scrim — covers the lower ~62% so the big content stays legible */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={SCRIM} stopOpacity="0.97" />
            <Stop offset="0.42" stopColor={SCRIM} stopOpacity="0.86" />
            <Stop offset="0.72" stopColor={SCRIM} stopOpacity="0.34" />
            <Stop offset="1" stopColor={SCRIM} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scrim)" />
      </Svg>

      {/* Content */}
      <View style={{ bottom: 0, left: 0, padding: u(0.066), paddingBottom: u(0.075), position: 'absolute', right: 0 }}>
        <Text style={{ color: LIGHT_ACCENT, fontFamily: fonts.mono, fontSize: u(0.035), fontWeight: '600', letterSpacing: u(0.004), textTransform: 'uppercase' }}>
          {data.eyebrow}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            color: '#FFFFFF',
            fontFamily: fonts.display,
            fontSize: u(0.118),
            fontWeight: '700',
            letterSpacing: -u(0.003),
            lineHeight: u(0.128),
            marginTop: u(0.03),
            textShadowColor: 'rgba(0,0,0,0.4)',
            textShadowOffset: { width: 0, height: u(0.004) },
            textShadowRadius: u(0.016),
          }}
        >
          {data.title}
        </Text>

        {isProgress ? (
          <View style={{ gap: u(0.05), marginTop: u(0.07) }}>
            <View style={{ flexDirection: 'row', gap: u(0.03) }}>
              <ProgressStat value={`${data.progress?.streakDays ?? 0}`} label="day streak" u={u} />
              <ProgressStat value={data.progress?.weightKg ? `${round(data.progress.weightKg)}kg` : '--'} label="weight" u={u} />
              <ProgressStat value={`${round(data.calories)}`} label="kcal today" u={u} />
            </View>
            <View style={{ gap: u(0.022) }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, height: u(0.026), overflow: 'hidden' }}>
                <View style={{ backgroundColor: LIGHT_ACCENT, height: u(0.026), width: `${data.progress?.calorieProgressPct ?? 0}%` }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.62)', fontFamily: fonts.mono, fontSize: u(0.032), fontWeight: '500', letterSpacing: u(0.0015), textTransform: 'uppercase' }}>
                {round(data.progress?.calorieProgressPct ?? 0)}% calorie target
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* kcal — giant hero number */}
            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: u(0.028), marginTop: u(0.08) }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{
                  color: '#FFFFFF',
                  flexShrink: 1,
                  fontFamily: fonts.mono,
                  fontSize: u(0.215),
                  fontWeight: '500',
                  letterSpacing: -u(0.005),
                  // lineHeight must be >= fontSize or the digits get clipped vertically.
                  lineHeight: u(0.235),
                  textShadowColor: 'rgba(0,0,0,0.35)',
                  textShadowOffset: { width: 0, height: u(0.004) },
                  textShadowRadius: u(0.012),
                }}
              >
                {round(data.calories)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: fonts.mono, fontSize: u(0.044), fontWeight: '500', marginBottom: u(0.03) }}>kcal</Text>
            </View>

            {/* Macro bar */}
            <View style={{ borderRadius: 999, flexDirection: 'row', gap: u(0.006), height: u(0.026), marginTop: u(0.06), overflow: 'hidden' }}>
              <View style={{ backgroundColor: colors.protein, width: `${segments.proteinPct}%` }} />
              <View style={{ backgroundColor: colors.carbs, width: `${segments.carbsPct}%` }} />
              <View style={{ backgroundColor: colors.fat, width: `${segments.fatPct}%` }} />
            </View>
            {/* Macros — big columns */}
            <View style={{ flexDirection: 'row', gap: u(0.03), marginTop: u(0.04) }}>
              <MacroCol color={colors.protein} label="Protein" grams={`${round(data.macros.proteinG)}g`} u={u} />
              <MacroCol color={colors.carbs} label="Carbs" grams={`${round(data.macros.carbsG)}g`} u={u} />
              <MacroCol color={colors.fat} label="Fat" grams={`${round(data.macros.fatG)}g`} u={u} />
            </View>
          </>
        )}

        {/* Brand + App Store QR */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.16)', height: u(0.004), marginVertical: u(0.06) }} />
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: u(0.035) }}>
          <AppStoreQr size={u(0.185)} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: fonts.display, fontSize: u(0.058), fontWeight: '700', letterSpacing: -u(0.001) }}>MacroLens</Text>
            <Text style={{ color: 'rgba(255,255,255,0.62)', fontFamily: fonts.mono, fontSize: u(0.032), fontWeight: '500', letterSpacing: u(0.0018), marginTop: u(0.01), textTransform: 'uppercase' }}>
              Scan → get the app
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});
