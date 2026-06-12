import { Circle, Path, Svg } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useThemeColors';

const STROKE_WIDTH = 1.5;

type Variant = 'routine' | 'todo' | 'fasting' | 'stats';

type Props = {
  variant: Variant;
  size?: number;
};

export function EmptyIllustration({ variant, size = 72 }: Props) {
  const c = useThemeColors();
  const stroke = c.inkTertiary;

  if (variant === 'routine') {
    return (
      <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <Circle cx="36" cy="36" r="28" stroke={stroke} strokeWidth={STROKE_WIDTH} />
        <Path
          d="M24 38 L32 46 L50 28"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (variant === 'todo') {
    return (
      <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <Path d="M20 22 H52" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        <Path d="M20 36 H44" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        <Path d="M20 50 H36" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        <Circle cx="54" cy="50" r="8" stroke={stroke} strokeWidth={STROKE_WIDTH} />
      </Svg>
    );
  }

  if (variant === 'fasting') {
    return (
      <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <Circle cx="36" cy="36" r="24" stroke={stroke} strokeWidth={STROKE_WIDTH} />
        <Path
          d="M36 20 V36 L46 42"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <Path d="M16 18 H56 V54 H16 Z" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <Path d="M16 28 H56" stroke={stroke} strokeWidth={STROKE_WIDTH} />
      <Circle cx="26" cy="40" r="3" fill={stroke} />
      <Circle cx="36" cy="40" r="3" fill={stroke} />
      <Circle cx="46" cy="40" r="3" fill={stroke} />
    </Svg>
  );
}
