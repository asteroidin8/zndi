import { useEffect } from 'react';
import {
  type WithTimingConfig,
  type WithSpringConfig,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Options = {
  scaleFrom?: number;
  spring?: WithSpringConfig | false;
  timing?: WithTimingConfig;
};

export function useModalAnimation(opts?: Options) {
  const scaleFrom = opts?.scaleFrom ?? 0.92;
  const useSpring = opts?.spring !== undefined && opts.spring !== false;

  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(scaleFrom);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 200 });
    scale.value = useSpring
      ? withSpring(1, opts!.spring as WithSpringConfig)
      : withTiming(1, opts?.timing ?? { duration: 220 });
  }, [backdropOpacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: backdropOpacity.value,
  }));

  return { backdropOpacity, backdropStyle, contentStyle };
}
