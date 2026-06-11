import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label: string;
  subLabel?: string;
  onConfirm: () => void;
  duration?: number;
};

export function HoldToConfirmButton({ label, subLabel, onConfirm, duration = 1600 }: Props) {
  const c = useThemeColors();
  const progress = useSharedValue(0);
  const hapticFiredRef = useRef<Set<number>>(new Set());

  function fireHaptic(style: Haptics.ImpactFeedbackStyle) {
    Haptics.impactAsync(style).catch(() => {});
  }

  function fireSuccessHaptic() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  function handleConfirm() {
    onConfirm();
  }

  function handlePressIn() {
    hapticFiredRef.current.clear();
    fireHaptic(Haptics.ImpactFeedbackStyle.Light);

    progress.value = withTiming(1, { duration }, (finished) => {
      if (finished) {
        runOnJS(fireSuccessHaptic)();
        runOnJS(handleConfirm)();
      }
    });
  }

  function handlePressOut() {
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 300 });
  }

  // 진행률 구간마다 햅틱 발생 (JS 측에서 폴링 없이 reanimated worklet 방식으로)
  // 여기서는 단순하게 50%, 80% 지점에서 발생시키기 위해 derive 사용 불가 → 타이머로 처리
  const hapticTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearHapticTimers() {
    hapticTimersRef.current.forEach(clearTimeout);
    hapticTimersRef.current = [];
  }

  function scheduleHaptics() {
    clearHapticTimers();
    hapticTimersRef.current = [
      setTimeout(() => fireHaptic(Haptics.ImpactFeedbackStyle.Medium), duration * 0.45),
      setTimeout(() => fireHaptic(Haptics.ImpactFeedbackStyle.Heavy), duration * 0.8),
    ];
  }

  function handlePressInWithHaptics() {
    scheduleHaptics();
    handlePressIn();
  }

  function handlePressOutWithCleanup() {
    clearHapticTimers();
    handlePressOut();
  }

  useEffect(() => {
    return () => {
      clearHapticTimers();
    };
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const labelColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 0.45], [c.ink, c.surface]),
  }));

  const subLabelColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 0.45], [c.inkTertiary, c.surface]),
    opacity: 1 - progress.value * 0.4,
  }));

  return (
    <Pressable
      onPressIn={handlePressInWithHaptics}
      onPressOut={handlePressOutWithCleanup}
      style={[styles.button, { borderColor: c.borderStrong, backgroundColor: c.surface }]}
    >
      {/* 게이지 fill */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.fill,
          { backgroundColor: c.ink },
          fillStyle,
        ]}
      />

      {/* 텍스트 */}
      <View style={styles.textWrapper}>
        <Animated.Text style={[{ fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }, labelColorStyle]}>
          {label}
        </Animated.Text>
        {subLabel && (
          <Animated.Text style={[{ fontSize: 12 }, subLabelColorStyle]}>
            {subLabel}
          </Animated.Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 0,
  },
  textWrapper: {
    alignItems: 'center',
    gap: 2,
  },
});
