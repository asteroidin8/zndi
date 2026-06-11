import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Routine } from '@/stores/useRoutineStore';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  routine: Routine;
  isCompleted?: boolean;
  onToggle?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function RoutineItem({ routine, isCompleted = false, onToggle, onLongPress, onPress }: Props) {
  const c = useThemeColors();
  const scale = useSharedValue(1);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleToggle() {
    scale.value = withSequence(
      withSpring(0.75, { duration: 80 }),
      withSpring(1.15, { duration: 100 }),
      withSpring(1, { duration: 120 }),
    );
    Haptics.impactAsync(
      isCompleted
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    ).catch(() => {});
    onToggle?.();
  }

  return (
    <Pressable
      onPress={onPress ?? handleToggle}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
      }}
    >
      {/* 체크박스 */}
      <Pressable onPress={handleToggle} hitSlop={8}>
        <Animated.View
          style={[
            {
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: isCompleted ? c.ink : c.borderStrong,
              backgroundColor: isCompleted ? c.ink : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            },
            checkboxStyle,
          ]}
        >
          {isCompleted && <AppIcon name="Check" size={13} color={c.surface} strokeWidth={2.5} />}
        </Animated.View>
      </Pressable>

      {/* 내용 */}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="body"
          tone={isCompleted ? 'tertiary' : 'primary'}
          style={isCompleted ? { textDecorationLine: 'line-through' } : {}}
        >
          {routine.name}
        </AppText>
        <AppText variant="caption" tone="disabled">
          {routine.repeatDays.map((d) => DAY_LABELS[d]).join('·')}
          {routine.reminderTime ? `  ·  ${routine.reminderTime}` : ''}
        </AppText>
      </View>
    </Pressable>
  );
}
