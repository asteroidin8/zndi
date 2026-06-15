import { Text, type TextProps } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

type Variant = 'display' | 'headline' | 'title' | 'body' | 'caption' | 'mono' | 'stat' | 'timer';
type Tone = 'primary' | 'secondary' | 'tertiary' | 'disabled';

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

const sizeMap: Record<Variant, number> = {
  display: 48,
  headline: 28,
  title: 20,
  body: 15,
  caption: 12,
  mono: 15,
  stat: 22,
  timer: 62,
};

const weightMap: Record<Variant, TextProps['style']> = {
  display: { fontWeight: '300', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  headline: { fontWeight: '600', lineHeight: 36 },
  title: { fontWeight: '600' },
  body: { fontWeight: '400' },
  caption: { fontWeight: '400' },
  mono: { fontWeight: '400', fontVariant: ['tabular-nums'] },
  stat: { fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  timer: {
    fontWeight: '700',
    letterSpacing: -3,
    lineHeight: 70,
    fontVariant: ['tabular-nums'],
  },
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: Props) {
  const c = useThemeColors();

  const toneColor: Record<Tone, string> = {
    primary: c.ink,
    secondary: c.inkSecondary,
    tertiary: c.inkTertiary,
    disabled: c.inkDisabled,
  };

  return (
    <Text
      style={[
        { fontSize: sizeMap[variant], color: toneColor[tone] },
        weightMap[variant],
        style,
      ]}
      {...props}
    />
  );
}
