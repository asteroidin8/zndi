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

export function elevationShadow(level: 1 | 2 | 3): ViewStyle {
  const configs = {
    1: { shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    2: { shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
    3: { shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
  } as const;
  const cfg = configs[level];
  return {
    shadowColor: '#000',
    shadowOpacity: cfg.shadowOpacity,
    shadowRadius: cfg.shadowRadius,
    shadowOffset: { width: 0, height: level },
    elevation: cfg.elevation,
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
    borderWidth: 2,
    borderColor: checked ? c.primary : c.inkTertiary,
    backgroundColor: checked ? c.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...(checked ? neonGlowShadow(c, 'soft') : {}),
  };
}
