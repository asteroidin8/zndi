import { useColorScheme } from 'react-native';

import { colors } from '@/constants/colors';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useThemeColors() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const scheme =
    themeMode === 'system' ? systemScheme : themeMode;

  return scheme === 'dark' ? colors.dark : colors.light;
}
