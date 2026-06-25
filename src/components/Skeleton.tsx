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

export function BoardCardSkeleton() {
  const c = useThemeColors();
  return (
    <View
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.card,
        borderRadius: radius.md,
        backgroundColor: c.surfaceSubtle,
        borderWidth: 1,
        borderColor: c.borderNeutral,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <SkeletonBox width="50%" height={16} style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', gap: -4 }}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox key={i} width={28} height={28} rounded="xl" style={{ borderRadius: 14 }} />
        ))}
      </View>
    </View>
  );
}

export function BoardListSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {[0, 1, 2].map((i) => (
        <BoardCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function FriendRowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width={80} height={14} />
        <SkeletonBox width={60} height={12} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBox key={i} width={28} height={28} rounded="sm" />
        ))}
      </View>
    </View>
  );
}

export function FriendListSkeleton() {
  return (
    <View style={{ gap: spacing.sm }}>
      {[0, 1, 2].map((i) => (
        <FriendRowSkeleton key={i} />
      ))}
    </View>
  );
}
