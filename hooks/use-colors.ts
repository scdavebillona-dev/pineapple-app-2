import { useColorScheme } from 'react-native';

import { Colors, DarkColors } from '@/constants/theme';

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : Colors;
}
