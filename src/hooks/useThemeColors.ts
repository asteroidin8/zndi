import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { colors } from '@/constants/colors';
import { deriveThemeColors } from '@/constants/grassTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useThemeColors() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const grassColor = useSettingsStore((s) => s.grassColor);

  const scheme =
    themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode;

  const base = scheme === 'dark' ? colors.dark : colors.light;
  const isDark = scheme === 'dark';

  return useMemo(() => {
    const derived = deriveThemeColors(grassColor, isDark);
    if (!derived) return base;
    return { ...base, ...derived };
  }, [base, grassColor, isDark]);
}
