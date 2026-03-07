/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, DarkColors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colorFromProps = isDark ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return isDark ? DarkColors[colorName] : Colors[colorName];
  }
}
