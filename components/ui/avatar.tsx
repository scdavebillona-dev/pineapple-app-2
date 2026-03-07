/**
 * PineAI System - Avatar Component
 * User avatar with fallback initials
 */

import { MaterialIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useColors } from '@/hooks/use-colors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const fontSizeMap = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 36,
};

export function Avatar({ name, imageUrl, size = 'md', style }: AvatarProps) {
  const colors = useColors();
  const sizeValue = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const containerStyle: ViewStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: sizeValue / 2,
  };

  if (imageUrl) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 }]}
        />
      </View>
    );
  }

  if (name) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }, containerStyle, style]}>
        <Text style={[styles.initials, { fontSize, color: colors.textInverse }]}>{getInitials(name)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fallback, containerStyle, style]}>
      <MaterialIcons name="person" size={sizeValue * 0.5} color={colors.textInverse} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    backgroundColor: undefined,
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});
