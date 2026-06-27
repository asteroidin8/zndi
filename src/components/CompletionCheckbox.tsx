import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { useThemeColors } from '@/hooks/useThemeColors';
import { completionCheckboxStyle } from '@/constants/themeEffects';

type Props = {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  label: string;
  iconSize?: number;
  shape?: 'rounded' | 'circle';
};

/** 루틴·할일 완료 체크 — scale + neon glow + ripple ring */
export function CompletionCheckbox({
  checked,
  onToggle,
  size = 26,
  label,
  iconSize = 14,
  shape = 'rounded',
}: Props) {
  const c = useThemeColors();
  const scale = useSharedValue(1);
  const ripple = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => {
    const s = 1 + ripple.value * 0.8;
    return {
      position: 'absolute' as const,
      width: size,
      height: size,
      borderRadius: shape === 'circle' ? size / 2 : size <= 20 ? size / 2 : 6,
      borderWidth: 2,
      borderColor: c.primary,
      opacity: (1 - ripple.value) * 0.6,
      transform: [{ scale: s }],
    };
  });

  function handlePress() {
    if (!checked) {
      ripple.value = 0;
      ripple.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    }
    scale.value = withSequence(
      withSpring(0.75, { duration: 80 }),
      withSpring(1.15, { duration: 100 }),
      withSpring(1, { duration: 120 }),
    );
    onToggle();
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={rippleStyle} />
        <Animated.View
          style={[
            completionCheckboxStyle(c, checked, size, shape),
            animatedStyle,
          ]}
        >
          {checked && (
            <AppIcon name="Check" size={iconSize} color={c.onPrimary} strokeWidth={2.5} />
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}
