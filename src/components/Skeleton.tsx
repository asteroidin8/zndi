import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  rounded?: keyof typeof radius;
};

export function SkeletonBox({ width = '100%', height = 16, style, rounded = 'md' }: Props) {
  const c = useThemeColors();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius[rounded],
          backgroundColor: c.surfaceMuted,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function StatsSummarySkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.gap }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flex: 1, gap: 8 }}>
          <SkeletonBox height={12} width="60%" />
          <SkeletonBox height={28} />
        </View>
      ))}
    </View>
  );
}
