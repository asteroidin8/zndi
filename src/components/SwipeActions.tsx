import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { feedbackComplete, feedbackDelete, feedbackUncomplete } from '@/utils/microFeedback';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  onDelete: () => void;
  onComplete?: () => void;
  completeLabel?: string;
  children: React.ReactNode;
};

export function SwipeActions({
  onDelete,
  onComplete,
  completeLabel = '완료',
  children,
}: Props) {
  const c = useThemeColors();
  const swipeRef = useRef<Swipeable>(null);

  function renderLeftDelete(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0],
    });
    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { backgroundColor: c.danger, transform: [{ translateX }] },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>삭제</Text>
      </Animated.View>
    );
  }

  function renderRightComplete(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { backgroundColor: c.primary, transform: [{ translateX }] },
        ]}
      >
        <Text style={{ color: c.onPrimary, fontSize: 13, fontWeight: '600' }}>{completeLabel}</Text>
      </Animated.View>
    );
  }

  function handleOpen(direction: 'left' | 'right') {
    swipeRef.current?.close();
    if (direction === 'left') {
      feedbackDelete();
      onDelete();
      return;
    }
    if (onComplete) {
      if (completeLabel === '완료') feedbackComplete();
      else feedbackUncomplete();
      onComplete();
    }
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      renderLeftActions={renderLeftDelete}
      renderRightActions={onComplete ? renderRightComplete : undefined}
      onSwipeableOpen={handleOpen}
    >
      <View accessibilityHint="왼쪽 스와이프로 삭제, 오른쪽 스와이프로 완료">{children}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
