/** zndi (잔디) 브랜드 팔레트
 *
 * 다크모드가 히어로 테마 — Deep Matte Black 위에 Neon Grass Green이 빛나는 구조.
 * Primary (#22C55E) = 성취·완료, Accent (#4ADE80) = 인터랙션·강조.
 */
export const colors = {
  light: {
    surface: '#ffffff',
    surfaceSubtle: '#f5f5f5',
    surfaceMuted: '#e8e8e8',
    ink: '#0a0a0a',
    inkSecondary: '#404040',
    inkTertiary: '#737373',
    inkDisabled: '#a3a3a3',
    border: '#d4d4d4',
    borderStrong: '#c4c4c4',
    borderNeutral: 'rgba(0, 0, 0, 0.10)',
    primary: '#22C55E',
    primaryContainer: '#22C55E',
    accent: '#4ADE80',
    neonGlow: '#16A34A',
    surfaceCard: '#f0f0f0',
    onPrimary: '#ffffff',
    danger: '#EF4444',
    warning: '#F59E0B',
    warningDark: '#D97706',
    booster: '#EF4444',
    priorityHigh: '#EF4444',
    priorityMid: '#F59E0B',
    priorityLow: '#6B7280',
  },
  dark: {
    surface: '#121212',
    surfaceSubtle: '#1A1A1A',
    surfaceMuted: '#262626',
    ink: '#F1F5F9',
    inkSecondary: '#CBD5E1',
    inkTertiary: '#94A3B8',
    inkDisabled: '#475569',
    border: 'rgba(74, 222, 128, 0.15)',
    borderStrong: 'rgba(74, 222, 128, 0.3)',
    borderNeutral: 'rgba(255, 255, 255, 0.06)',
    primary: '#22C55E',
    primaryContainer: '#4ADE80',
    accent: '#4ADE80',
    neonGlow: '#86EFAC',
    surfaceCard: '#1E1E1E',
    onPrimary: '#121212',
    danger: '#F87171',
    warning: '#FBBF24',
    warningDark: '#F59E0B',
    booster: '#F87171',
    priorityHigh: '#F87171',
    priorityMid: '#FBBF24',
    priorityLow: '#9CA3AF',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof (typeof colors)['dark']]: string };
