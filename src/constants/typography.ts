import type { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 48, fontWeight: '300', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  headline: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
  title: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  mono: { fontSize: 15, fontWeight: '400', fontVariant: ['tabular-nums'] },
  stat: { fontSize: 22, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  timer: { fontSize: 62, fontWeight: '700', letterSpacing: -3, lineHeight: 70, fontVariant: ['tabular-nums'] },
} as const;

export type TypographyVariant = keyof typeof typography;
