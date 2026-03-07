import { MaterialIcons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

interface InputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      icon,
      error,
      hint,
      containerStyle,
      showPasswordToggle = false,
      secureTextEntry,
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const colors = useColors();

    const isSecure = secureTextEntry && !showPassword;
    const hasError = !!error;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary },
            isFocused && { color: colors.primary },
            hasError && { color: colors.error },
          ]}
        >
          {label}
        </Text>

        {/* Input wrapper */}
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isFocused && { borderColor: colors.primary, backgroundColor: colors.background },
            hasError && { borderColor: colors.error, backgroundColor: colors.errorLight },
          ]}
        >
          {/* Icon */}
          {icon && (
            <MaterialIcons
              name={icon}
              size={20}
              color={isFocused ? colors.primary : colors.textMuted}
              style={styles.icon}
            />
          )}

          {/* Text Input */}
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, !icon && styles.inputNoIcon]}
            placeholderTextColor={colors.placeholder}
            value={value}
            secureTextEntry={isSecure}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Password toggle */}
          {showPasswordToggle && secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.toggleButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={isFocused ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Error or hint message */}
        {(error || hint) && (
          <Text style={[styles.hint, { color: colors.textMuted }, hasError && { color: colors.error }]}>
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySmallMedium,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  icon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  inputNoIcon: {
    paddingLeft: 0,
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
