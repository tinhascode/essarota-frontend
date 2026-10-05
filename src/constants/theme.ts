import '@/global.css';

import { Platform } from 'react-native';

/**
 * Paleta derivada da logo EssaRota: índigo/violeta (#2B2FB5, #8286F2, #9AA0FF),
 * verde (#25D366), teal (#19B5A5) e navy (#1B1E4B).
 */
export const Brand = {
  indigo: '#2B2FB5',
  violet: '#8286F2',
  lavender: '#9AA0FF',
  green: '#25D366',
  teal: '#19B5A5',
  navy: '#1B1E4B',
} as const;

export const Colors = {
  light: {
    text: '#1B1E4B',
    textSecondary: '#5B5F87',
    background: '#FFFFFF',
    backgroundElement: '#F5F5FA',
    backgroundSelected: '#E9E9F7',
    border: '#E4E4F0',
    primary: Brand.indigo,
    primaryText: Brand.indigo,
    primarySoft: '#ECECFD',
    onPrimary: '#FFFFFF',
    accent: Brand.green,
    accentText: '#128C45',
    accentSoft: '#E3F9EC',
    onAccent: '#06331A',
    teal: Brand.teal,
    danger: '#E5484D',
    dangerSoft: '#FDECEC',
    overlay: 'rgba(27, 30, 75, 0.35)',
    shadow: '#1B1E4B',
  },
  dark: {
    text: '#F5F5FA',
    textSecondary: '#A4A6C4',
    background: '#000000',
    backgroundElement: '#121218',
    backgroundSelected: '#1E1E2C',
    border: '#26263A',
    primary: '#5B5FEF',
    primaryText: Brand.lavender,
    primarySoft: '#1C1D45',
    onPrimary: '#FFFFFF',
    accent: Brand.green,
    accentText: Brand.green,
    accentSoft: '#0D2A1A',
    onAccent: '#04260F',
    teal: Brand.teal,
    danger: '#FF6369',
    dangerSoft: '#2D1214',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: '#000000',
  },
} as const;

export type ColorSchemeName = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ColorSchemeName];
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const MaxContentWidth = 800;
