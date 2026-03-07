/**
 * PineAI System - Professional Theme Configuration
 * Comprehensive design system with colors, typography, spacing, and shadows
 */

import { Platform, ViewStyle } from 'react-native';

// Core color palette
export const Colors = {
  // Brand colors
  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryLight: '#FB923C',
  primaryMuted: 'rgba(234, 88, 12, 0.15)',
  
  // Secondary colors
  secondary: '#0D9488',
  secondaryLight: '#14B8A6',
  accent: '#FBBF24',
  
  // Neutral colors
  text: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  
  // Background colors
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F3F4F6',
  
  // UI colors
  icon: '#EA580C',
  tabIconDefault: '#6B7280',
  tabIconSelected: '#EA580C',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#EA580C',
  placeholder: '#6B7280',

  // Semantic colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// Dark mode color palette
export const DarkColors: typeof Colors = {
  // Brand colors
  primary: '#FB923C',
  primaryDark: '#EA580C',
  primaryLight: '#FDBA74',
  primaryMuted: 'rgba(251, 146, 60, 0.2)',
  
  // Secondary colors
  secondary: '#14B8A6',
  secondaryLight: '#2DD4BF',
  accent: '#FBBF24',
  
  // Neutral colors
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textInverse: '#1F2937',
  
  // Background colors
  background: '#111827',
  surface: '#1F2937',
  surfaceElevated: '#263244',
  surfaceHover: '#374151',
  
  // UI colors
  icon: '#FB923C',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#FB923C',
  border: '#374151',
  borderLight: '#2D3748',
  borderFocus: '#FB923C',
  placeholder: '#6B7280',

  // Semantic colors
  success: '#34D399',
  successLight: 'rgba(16, 185, 129, 0.2)',
  warning: '#FBBF24',
  warningLight: 'rgba(245, 158, 11, 0.2)',
  error: '#F87171',
  errorLight: 'rgba(239, 68, 68, 0.2)',
  info: '#60A5FA',
  infoLight: 'rgba(59, 130, 246, 0.2)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// Typography system
export const Typography = {
  h1: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Montserrat_600SemiBold',
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmallMedium: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  captionSmall: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    fontWeight: '500' as const,
    lineHeight: 14,
  },
  button: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    fontWeight: '600' as const,
    lineHeight: 20,
  },
};

// Spacing scale (4px base)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// Border radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow definitions
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  } as ViewStyle,
  focus: {
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 0,
  } as ViewStyle,
};

// Animation durations
export const Animation = {
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
};

// Font families
export const Fonts = Platform.select({
  ios: {
    sans: 'Montserrat',
    serif: 'Montserrat',
    rounded: 'Montserrat',
    mono: 'Montserrat',
  },
  default: {
    sans: 'Montserrat',
    serif: 'Montserrat',
    rounded: 'Montserrat',
    mono: 'Montserrat',
  },
  web: {
    sans: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'Montserrat', Georgia, 'Times New Roman', serif",
    rounded: "'Montserrat', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "'Montserrat', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Complete theme export
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  animation: Animation,
  fonts: Fonts,
};
