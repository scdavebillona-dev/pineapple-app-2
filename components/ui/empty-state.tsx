/**
 * PineAI System - Empty State Component
 * Placeholder for empty lists and screens
 */

import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { Button } from './button';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <MaterialIcons name={icon} size={48} color={colors.textMuted} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      
      {description && (
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          variant="primary"
          size="md"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.bodySmall,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: Spacing.xxl,
  },
  button: {
    minWidth: 160,
  },
});
