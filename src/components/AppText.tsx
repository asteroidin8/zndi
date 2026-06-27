import { Text, type TextProps } from 'react-native';

import { typography, type TypographyVariant } from '@/constants/typography';
import { useThemeColors } from '@/hooks/useThemeColors';

type Variant = TypographyVariant;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'disabled';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
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
        { color: toneColor[tone] },
        typography[variant],
        style,
      ]}
      {...props}
    />
  );
}
