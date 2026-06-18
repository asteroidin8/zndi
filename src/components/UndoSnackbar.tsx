import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
};

export function UndoSnackbar({ message, visible, onUndo, onDismiss, duration = 3000 }: Props) {
  const c = useThemeColors();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20 });
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, duration);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: c.ink },
        style,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <AppText variant="caption" style={{ color: c.surface, flex: 1 }}>
        {message}
      </AppText>
      <Pressable
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          onUndo();
          onDismiss();
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="실행 취소"
      >
        <AppText variant="caption" style={{ color: c.accent, fontWeight: '700' }}>
          취소
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
