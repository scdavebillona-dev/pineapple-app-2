/**
 * PineAI System - Search Bar Component
 * Search input with clear button and optional filter
 */

import { MaterialIcons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    useColorScheme,
    View,
    ViewStyle,
} from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  onSearch?: (query: string) => void;
  onFilterPress?: () => void;
  showFilter?: boolean;
  containerStyle?: ViewStyle;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      onSearch,
      onFilterPress,
      showFilter = false,
      containerStyle,
      placeholder = 'Search...',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const colors = useColors();

    const handleClear = () => {
      onChangeText?.('');
      onSearch?.('');
    };

    const handleSubmit = () => {
      onSearch?.(value || '');
    };

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isFocused && { borderColor: colors.primary, backgroundColor: colors.background },
          containerStyle,
        ]}
      >
        <MaterialIcons
          name="search"
          size={20}
          color={isFocused ? colors.primary : colors.textMuted}
          style={styles.searchIcon}
        />

        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          {...props}
        />

        {value && value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialIcons
              name="close"
              size={20}
              color={isDark ? '#F87171' : '#EF4444'}
            />
          </TouchableOpacity>
        )}

        {showFilter && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
              <MaterialIcons name="tune" size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: '100%',
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.md,
  },
  filterButton: {
    padding: Spacing.xs,
  },
});
