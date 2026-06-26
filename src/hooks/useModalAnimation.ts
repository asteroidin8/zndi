import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function useModalAnimation() {
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 220 });
  }, [backdropOpacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: backdropOpacity.value,
  }));

  return { backdropStyle, contentStyle };
}
