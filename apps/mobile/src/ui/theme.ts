/**
 * MacroLens — "Clinical Trust" design system.
 *
 * Re-skin notes:
 * - Every legacy token name (ink, muted, background, green, protein, …) is kept so
 *   existing screens adopt the new palette with zero edits.
 * - New tokens (accent*, warn*, danger*, ink2, line2, paper2/3, *Wash) are added for
 *   the redesigned screens + primitives.
 * - OKLCH values from the prototype are converted to hex for React Native.
 */
export const colors = {
  // paper / ink
  ink: '#16181C',
  ink2: '#34373D',
  muted: '#6B6F77',
  muted2: '#9499A0',
  background: '#FAFAF9',
  paper: '#FAFAF9',
  paper2: '#F3F3F1',
  paper3: '#ECECE9',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3F1',
  line: '#E5E4E0',
  line2: '#D5D4CF',
  black: '#16181C',

  // accent — clinical emerald (the single brand accent / "Verified")
  green: '#149E6E',
  greenSoft: '#E6F4EE',
  accent: '#149E6E',
  accentInk: '#0C6B4C',
  accentWash: '#E6F4EE',
  accentLine: '#BFE3D3',

  // warn — "Estimated" amber
  amber: '#D98E2B',
  amberSoft: '#F7EEDD',
  warn: '#D98E2B',
  warnInk: '#8A5A1E',
  warnWash: '#F7EEDD',
  warnLine: '#E6D3A8',

  // danger
  red: '#C6452F',
  redSoft: '#F6E2DC',
  danger: '#C6452F',
  dangerInk: '#9A3322',
  dangerWash: '#F6E2DC',
  dangerLine: '#E6C2B7',

  // secondary blue (refined)
  blue: '#3E6BC8',
  blueSoft: '#E7EDF8',

  // macros — restrained instrument trio
  protein: '#C75A45',
  proteinWash: '#F5E2DD',
  carbs: '#D6A24A',
  carbsWash: '#F6ECD9',
  fat: '#5C7CC2',
  fatWash: '#E4EAF5',
  fiber: '#8268B0',
  fiberWash: '#EDE7F5',

  // night (scanner / dark surfaces)
  night: '#1A1C20',
  night2: '#2A2D33',

  scannerGlass: 'rgba(255,255,255,0.92)',
  scannerPanel: 'rgba(8,8,8,0.42)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const radius = {
  sm: 9,
  md: 13,
  lg: 18,
  pill: 999,
};

export const typography = {
  hero: 34,
  title: 28,
  heading: 22,
  subheading: 18,
  body: 16,
  small: 13,
  tiny: 11,
  eyebrow: 10,
};

/**
 * Font families (loaded via @expo-google-fonts + useFonts in App.tsx).
 * - display: Space Grotesk (brand wordmark + hero titles)
 * - mono: IBM Plex Mono (every number + eyebrow label — the signature)
 * - sans: undefined => system (body keeps perfect cross-platform weights)
 */
export const fonts = {
  display: 'SpaceGrotesk_700Bold' as string | undefined,
  sans: undefined as string | undefined,
  mono: 'IBMPlexMono_500Medium',
};

export const shadows = {
  card: {
    shadowColor: '#141C24',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
};
