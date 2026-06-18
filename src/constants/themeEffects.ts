import type { ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/colors';

/** Neon grass glow — iOS shadow + Android elevation */
export function neonGlowShadow(
  c: ThemeColors,
  intensity: 'soft' | 'strong' = 'soft',
): ViewStyle {
  if (intensity === 'strong') {
    return {
      shadowColor: c.neonGlow,
      shadowOpacity: 0.6,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    };
  }
  return {
    shadowColor: c.neonGlow,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  };
}

/** 잔디 셀 전용 글로우 */
export function grassGlowShadow(c: ThemeColors): ViewStyle {
  return {
    shadowColor: c.neonGlow,
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
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
