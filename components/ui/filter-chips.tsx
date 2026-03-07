/**
 * PineAI System - Filter Chips Component
 * Horizontal scrollable filter chips
 */

import { ScrollView, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

interface FilterChip {
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedValue: string;
  onSelect: (value: string) => void;
  containerStyle?: ViewStyle;
}

export function FilterChips({
  chips,
  selectedValue,
  onSelect,
  containerStyle,
}: FilterChipsProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, containerStyle]}
    >
      {chips.map((chip) => {
        const isSelected = chip.value === selectedValue;
        return (
          <TouchableOpacity
            key={chip.value}
            onPress={() => onSelect(chip.value)}
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textSecondary },
                isSelected && { color: colors.textInverse },
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.bodySmallMedium,
  },
});
