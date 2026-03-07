/**
 * PineAI System - Stat Card Component
 * Display statistics with icon and animated counter
 */

import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof MaterialIcons.glyphMap | string;
  iconFamily?: 'MaterialIcons' | 'FontAwesome5';
  iconColor?: string;
  suffix?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  style?: ViewStyle;
  animated?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  iconFamily = 'MaterialIcons',
  iconColor,
  suffix = '',
  trend,
  style,
  animated = true,
}: StatCardProps) {
  const colors = useColors();
  const resolvedIconColor = iconColor || colors.primary;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => createStatStyles(colors), [colors]);

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [animated]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: resolvedIconColor + '15' }]}>
        {iconFamily === 'FontAwesome5' ? (
          <FontAwesome5 name={icon as any} size={20} color={resolvedIconColor} />
        ) : (
          <MaterialIcons name={icon as any} size={24} color={resolvedIconColor} />
        )}
      </View>

      <Text style={styles.value}>
        {value}
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </Text>
      
      <Text style={styles.title}>{title}</Text>

      {trend && (
        <View style={styles.trendContainer}>
          <MaterialIcons
            name={trend.positive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.positive ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.positive ? colors.success : colors.error },
            ]}
          >
            {trend.positive ? '+' : ''}{trend.value}%
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const createStatStyles = (colors: typeof Colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  value: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  suffix: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  title: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 2,
  },
  trendText: {
    ...Typography.captionSmall,
    fontWeight: '600',
  },
});
