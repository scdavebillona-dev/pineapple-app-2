/**
 * PineAI System - Button Component
 * Primary, Secondary, Ghost, and Outline variants
 */

import { MaterialIcons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizeStyles = {
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.buttonSmall,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Typography.button,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    fontSize: 18,
    fontWeight: '600' as const,
  },
};

const getVariantStyles = (colors: typeof Colors) => ({
  primary: {
    backgroundColor: colors.primary,
    textColor: colors.textInverse,
    borderColor: 'transparent',
    pressedBg: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.secondary,
    textColor: colors.textInverse,
    borderColor: 'transparent',
    pressedBg: '#0B8075',
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: colors.primary,
    borderColor: 'transparent',
    pressedBg: colors.primaryMuted,
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: colors.primary,
    borderColor: colors.primary,
    pressedBg: colors.primaryMuted,
  },
  danger: {
    backgroundColor: colors.error,
    textColor: colors.textInverse,
    borderColor: 'transparent',
    pressedBg: '#DC2626',
  },
});

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      title,
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const [pressed, setPressed] = useState(false);
    const colors = useColors();
    const vStyle = getVariantStyles(colors)[variant];
    const sStyle = sizeStyles[size];
    const isDisabled = disabled || loading;

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.button,
          {
            paddingVertical: sStyle.paddingVertical,
            paddingHorizontal: sStyle.paddingHorizontal,
            backgroundColor: pressed ? vStyle.pressedBg : vStyle.backgroundColor,
            borderColor: vStyle.borderColor,
            borderWidth: variant === 'outline' ? 2 : 0,
            opacity: isDisabled ? 0.6 : 1,
          },
          fullWidth && styles.fullWidth,
          variant === 'primary' && Shadows.sm,
          style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={vStyle.textColor} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <MaterialIcons
                name={icon}
                size={iconSize}
                color={vStyle.textColor}
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.text,
                {
                  fontSize: sStyle.fontSize,
                  fontWeight: sStyle.fontWeight,
                  color: vStyle.textColor,
                },
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <MaterialIcons
                name={icon}
                size={iconSize}
                color={vStyle.textColor}
                style={styles.iconRight}
              />
            )}
          </View>
        )}
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
