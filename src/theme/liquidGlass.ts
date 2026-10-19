/**
 * Liquid Glass 2.0 Design Tokens for «Уютный Дом»
 * Based on Samsung One UI rounded corners, soft lighting aura, and frosted glass materials.
 */

export interface LiquidGlassColors {
  primary: string;
  primaryGlow: string;
  accentCyan: string;
  accentPurple: string;
  accentAmber: string;
  backgroundDark: string;
  textDark: string;
  textSoft: string;
  textMuted: string;
  textLight: string;
}

export interface LiquidGlassTokens {
  bg: string;
  bgSubtle: string;
  bgSolid: string;
  border: string;
  borderLight: string;
  shadow: string;
  blurFilter: string;
  blurRadius: number;
  saturation: number;
}

export interface LiquidGlassGradients {
  auraWarm: [string, string];
  auraPurple: [string, string];
  auraCyan: [string, string];
  glassCard: [string, string];
  glassBorder: [string, string];
}

export interface LiquidGlassRadius {
  phone: number;
  card: number;
  tile: number;
  button: number;
  pill: number;
}

export interface LiquidGlassTypography {
  fontFamilyPrimary: string;
  fontFamilyAccent: string;
}

export interface LiquidGlassTheme {
  colors: LiquidGlassColors;
  glass: LiquidGlassTokens;
  gradients: LiquidGlassGradients;
  radius: LiquidGlassRadius;
  typography: LiquidGlassTypography;
}

export const liquidGlassTheme: LiquidGlassTheme = {
  colors: {
    primary: '#FF5E62',
    primaryGlow: 'rgba(255, 94, 98, 0.45)',
    accentCyan: '#00F2FE',
    accentPurple: '#9B51E0',
    accentAmber: '#FF9900',
    backgroundDark: '#0B0E17',
    textDark: '#16181D',
    textSoft: '#4E525E',
    textMuted: '#8E93A3',
    textLight: '#FFFFFF',
  },
  glass: {
    bg: 'rgba(255, 255, 255, 0.22)',
    bgSubtle: 'rgba(255, 255, 255, 0.12)',
    bgSolid: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(255, 255, 255, 0.45)',
    borderLight: 'rgba(255, 255, 255, 0.65)',
    shadow: '0 16px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.3) inset',
    blurFilter: 'blur(28px) saturate(190%)',
    blurRadius: 28,
    saturation: 1.9,
  },
  gradients: {
    auraWarm: ['#FF5E62', '#FF9966'],
    auraPurple: ['#7F00FF', '#E100FF'],
    auraCyan: ['#00F2FE', '#4FACFE'],
    glassCard: ['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.08)'],
    glassBorder: ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.25)'],
  },
  radius: {
    phone: 48,
    card: 24,
    tile: 16,
    button: 12,
    pill: 9999,
  },
  typography: {
    fontFamilyPrimary: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    fontFamilyAccent: 'Outfit, sans-serif',
  },
};
