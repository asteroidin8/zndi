import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  onDelete: () => void;
  children: React.ReactNode;
};

export function SwipeToDelete({ onDelete, children }: Props) {
  const c = useThemeColors();
  const swipeRef = useRef<Swipeable>(null);

  function handleDelete() {
    swipeRef.current?.close();
    onDelete();
  }

  function renderDeleteAction(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View
        style={[
          styles.deleteContainer,
          { backgroundColor: c.ink, transform: [{ translateX }] },
        ]}
      >
        <Text style={{ color: c.surface, fontSize: 13, fontWeight: '600' }}>삭제</Text>
      </Animated.View>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      renderLeftActions={renderDeleteAction}
      renderRightActions={renderDeleteAction}
      onSwipeableOpen={handleDelete}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteContainer: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
