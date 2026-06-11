export const colors = {
  light: {
    surface: '#ffffff',
    surfaceSubtle: '#f5f5f5',
    surfaceMuted: '#e8e8e8',
    ink: '#0a0a0a',
    inkSecondary: '#404040',
    inkTertiary: '#737373',
    inkDisabled: '#a3a3a3',
    border: '#e5e5e5',
    borderStrong: '#d4d4d4',
  },
  dark: {
    surface: '#0a0a0a',
    surfaceSubtle: '#141414',
    surfaceMuted: '#1f1f1f',
    ink: '#fafafa',
    inkSecondary: '#c0c0c0',
    inkTertiary: '#737373',
    inkDisabled: '#404040',
    border: '#1f1f1f',
    borderStrong: '#2e2e2e',
  },
} as const;

export type ColorScheme = keyof typeof colors;
