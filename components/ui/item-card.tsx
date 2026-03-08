/**
 * PineAI System - Item Card Component
 * Display scan items in storage list
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

const logoSource = require('../../assets/images/icon.png');

import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { ScanResult } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import { MaturityBadge, QualityBadge } from './badge';

interface ItemCardProps {
  item: ScanResult;
  onPress?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export function ItemCard({ item, onPress, onDelete, style }: ItemCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surfaceElevated, shadowColor: colors.primaryDark, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={[styles.thumbnail, { backgroundColor: colors.surface }]} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surface }]}>
            <Image source={logoSource} style={styles.thumbnailLogo} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
          <View style={styles.badges}>
            {item.quality && (
              <QualityBadge quality={item.quality} size="sm" />
            )}
            {item.maturity && (
              <MaturityBadge maturity={item.maturity} size="sm" />
            )}
          </View>
        </View>
        
        <Text style={[styles.timestamp, { color: colors.textMuted }]}>{formatRelativeTime(item.timestamp)}</Text>
        
        {item.notes && (
          <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>

      {/* Actions */}
      {onDelete ? (
        <TouchableOpacity 
          onPress={onDelete} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.deleteButton, { backgroundColor: colors.surface }]}
        >
          <MaterialIcons name="close" size={16} color={colors.error} />
        </TouchableOpacity>
      ) : (
        <View style={styles.actions}>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Grid variant of item card
 */
interface ItemCardGridProps {
  item: ScanResult;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ItemCardGrid({ item, onPress, style }: ItemCardGridProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.surfaceElevated, shadowColor: colors.primaryDark, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.gridImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.gridImage} />
        ) : (
          <View style={[styles.gridImagePlaceholder, { backgroundColor: colors.surface }]}>
            <Image source={logoSource} style={styles.gridLogoPlaceholder} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.gridContent}>
        <Text style={[styles.gridLabel, { color: colors.text }]}>{item.label}</Text>
        <Text style={[styles.gridTimestamp, { color: colors.textMuted }]}>{formatRelativeTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // List card styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
    shadowOpacity: 0.12,
    elevation: 4,
    borderWidth: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    borderRadius: 12,
    padding: 4,
  },
  thumbnailContainer: {
    marginRight: Spacing.lg,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodySemiBold,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  timestamp: {
    ...Typography.caption,
  },
  notes: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  actions: {
    marginLeft: Spacing.sm,
  },

  // Grid card styles
  gridCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    shadowOpacity: 0.12,
    elevation: 4,
    borderWidth: 1,
  },
  gridImageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    opacity: 0.4,
  },
  gridBadgeOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  gridContent: {
    padding: Spacing.md,
  },
  gridLabel: {
    ...Typography.bodySmallMedium,
    marginBottom: 2,
  },
  gridTimestamp: {
    ...Typography.captionSmall,
  },
});
