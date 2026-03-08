/**
 * PineAI System - Badge Component
 * Status indicators for confidence, quality, etc.
 */

import { StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const getVariantStyles = (colors: typeof Colors, isDark: boolean) => ({
  default: {
    backgroundColor: isDark ? colors.surfaceHover : colors.surface,
    textColor: colors.textSecondary,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.primaryMuted,
    textColor: colors.primary,
    borderColor: colors.primary,
  },
  success: {
    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.22)' : '#A7F3D0',
    textColor: isDark ? '#6EE7B7' : '#065F46',
    borderColor: isDark ? '#34D399' : '#10B981',
  },
  warning: {
    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.22)' : '#FDE68A',
    textColor: isDark ? '#FCD34D' : '#92400E',
    borderColor: isDark ? '#FBBF24' : '#F59E0B',
  },
  error: {
    backgroundColor: isDark ? 'rgba(248, 113, 113, 0.22)' : '#FECACA',
    textColor: isDark ? '#FCA5A5' : '#991B1B',
    borderColor: isDark ? '#F87171' : '#EF4444',
  },
  info: {
    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.22)' : '#BFDBFE',
    textColor: isDark ? '#93C5FD' : '#1E40AF',
    borderColor: isDark ? '#60A5FA' : '#3B82F6',
  },
});

const sizeStyles = {
  sm: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    fontSize: 10,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    fontSize: 12,
  },
  lg: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
  },
};

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const vStyle = getVariantStyles(colors, scheme === 'dark')[variant];
  const sStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyle.backgroundColor,
          borderColor: vStyle.borderColor,
          borderWidth: 1,
          paddingVertical: sStyle.paddingVertical,
          paddingHorizontal: sStyle.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: vStyle.textColor,
            fontSize: sStyle.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Confidence Badge - Automatically selects color based on confidence value
 */
interface ConfidenceBadgeProps {
  confidence: number; // 0-1 or 0-100
  size?: BadgeSize;
  style?: ViewStyle;
}

export function ConfidenceBadge({ confidence, size = 'md', style }: ConfidenceBadgeProps) {
  const value = confidence > 1 ? confidence : confidence * 100;
  
  let variant: BadgeVariant = 'error';
  if (value >= 90) variant = 'success';
  else if (value >= 75) variant = 'info';
  else if (value >= 60) variant = 'warning';

  return (
    <Badge
      label={`${value.toFixed(1)}%`}
      variant={variant}
      size={size}
      style={style}
    />
  );
}

/**
 * Quality Badge - Displays quality grade with appropriate color
 */
interface QualityBadgeProps {
  quality: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function QualityBadge({ quality, size = 'md', style }: QualityBadgeProps) {
  let variant: BadgeVariant = 'default';
  
  switch (quality) {
    case 'Premium':
    case 'Extra Class':
      variant = 'success';
      break;
    case 'Grade A':
    case 'Class I':
      variant = 'info';
      break;
    case 'Grade B':
    case 'Class II':
      variant = 'warning';
      break;
    case 'Standard':
      variant = 'default';
      break;
  }

  return <Badge label={quality} variant={variant} size={size} style={style} />;
}

/**
 * Maturity Badge - Displays maturity stage with pineapple-specific colors
 * Unripe=green, Underripe=lime, Ripe=amber/yellow, Overripe=orange
 */
interface MaturityBadgeProps {
  maturity: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

const MATURITY_COLORS: Record<string, { light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  Unripe: {
    light: { bg: '#DCFCE7', text: '#14532D', border: '#22C55E' },
    dark:  { bg: 'rgba(34,197,94,0.22)', text: '#86EFAC', border: '#22C55E' },
  },
  Underripe: {
    light: { bg: '#ECFCCB', text: '#365314', border: '#84CC16' },
    dark:  { bg: 'rgba(132,204,22,0.22)', text: '#BEF264', border: '#84CC16' },
  },
  Ripe: {
    light: { bg: '#FEF9C3', text: '#713F12', border: '#EAB308' },
    dark:  { bg: 'rgba(234,179,8,0.22)', text: '#FDE047', border: '#EAB308' },
  },
  Overripe: {
    light: { bg: '#FFEDD5', text: '#7C2D12', border: '#F97316' },
    dark:  { bg: 'rgba(249,115,22,0.22)', text: '#FB923C', border: '#F97316' },
  },
};

export function MaturityBadge({ maturity, size = 'md', style }: MaturityBadgeProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const sStyle = sizeStyles[size];

  const colors = MATURITY_COLORS[maturity];
  const c = colors ? (isDark ? colors.dark : colors.light) : null;

  if (!c) {
    return <Badge label={maturity} variant="default" size={size} style={style} />;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: 1,
          paddingVertical: sStyle.paddingVertical,
          paddingHorizontal: sStyle.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: c.text, fontSize: sStyle.fontSize }]}>
        {maturity}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
