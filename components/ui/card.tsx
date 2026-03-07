/**
 * PineAI System - Card Component
 * Elevated container with shadow and optional press states
 */

import { forwardRef, useState } from 'react';
import {
    Pressable,
    PressableProps,
    StyleSheet,
    View,
    ViewProps,
    ViewStyle,
} from 'react-native';

import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
}

const paddingMap = {
  none: 0,
  sm: Spacing.sm,
  md: Spacing.lg,
  lg: Spacing.xxl,
};

export const Card = forwardRef<View, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'md',
      onPress,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [pressed, setPressed] = useState(false);
    const colors = useColors();

    const getVariantStyle = (): ViewStyle => {
      switch (variant) {
        case 'elevated':
          return {
            backgroundColor: colors.surfaceElevated,
            ...Shadows.md,
            shadowColor: colors.primaryDark,
            shadowOpacity: 0.12,
            elevation: 4,
            borderWidth: 1,
            borderColor: colors.border,
          };
        case 'outlined':
          return {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
          };
        case 'flat':
          return {
            backgroundColor: colors.surface,
          };
        default:
          return {
            backgroundColor: colors.background,
          };
      }
    };

    const cardStyle: ViewStyle = {
      ...styles.card,
      ...getVariantStyle(),
      padding: paddingMap[padding],
      ...(pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }),
    };

    if (onPress) {
      return (
        <Pressable
          ref={ref}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={[cardStyle, style]}
          {...(props as PressableProps)}
        >
          {children}
        </Pressable>
      );
    }

    return (
      <View ref={ref} style={[cardStyle, style]} {...props}>
        {children}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
