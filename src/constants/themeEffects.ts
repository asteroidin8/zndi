import type { ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/colors';

/** Neon grass glow — iOS shadow + Android elevation */
export function neonGlowShadow(
  c: ThemeColors,
  intensity: 'soft' | 'strong' = 'soft',
): ViewStyle {
  if (intensity === 'strong') {
    return {
      shadowColor: c.primary,
      shadowOpacity: 0.55,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5,
    };
  }
  return {
    shadowColor: c.primary,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  };
}

export function completionCheckboxStyle(
  c: ThemeColors,
  checked: boolean,
  size = 24,
  shape: 'rounded' | 'circle' = 'rounded',
): ViewStyle {
  const borderRadius = shape === 'circle' ? size / 2 : size <= 20 ? size / 2 : 6;
  return {
    width: size,
    height: size,
    borderRadius,
    borderWidth: 1.5,
    borderColor: checked ? c.primary : c.borderStrong,
    backgroundColor: checked ? c.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...(checked ? neonGlowShadow(c, 'soft') : {}),
  };
}
