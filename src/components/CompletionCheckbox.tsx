import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
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

/** 루틴·할일 완료 체크 — scale + neon glow */
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
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
    </Pressable>
  );
}
