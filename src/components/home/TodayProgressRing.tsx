import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { useThemeColors } from '@/hooks/useThemeColors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
};

export function TodayProgressRing({ completed, total, size = 56, strokeWidth = 4 }: Props) {
  const c = useThemeColors();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total > 0 ? completed / total : 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [ratio, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  if (total === 0) return null;

  const percent = Math.round(ratio * 100);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <AppText
          variant="caption"
          style={{ fontWeight: '700', fontSize: 13, color: ratio >= 1 ? c.primary : c.ink }}
        >
          {percent}%
        </AppText>
      </View>
    </View>
  );
}
