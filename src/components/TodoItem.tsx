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
import type { Todo } from '@/stores/useTodoStore';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  mid: '#F59E0B',
  low: '#6B7280',
};

type Props = {
  todo: Todo;
  onToggle?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function TodoItem({ todo, onToggle, onLongPress, onPress }: Props) {
  const c = useThemeColors();
  const isCompleted = !!todo.completedAt;
  const dotColor = PRIORITY_COLORS[todo.priority] ?? c.inkTertiary;
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
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14 }}
    >
      {/* 체크박스 */}
      <Pressable onPress={handleToggle} hitSlop={8}>
        <Animated.View
          style={[
            {
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 1.5,
              borderColor: isCompleted ? c.ink : c.borderStrong,
              backgroundColor: isCompleted ? c.ink : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            },
            checkboxStyle,
          ]}
        >
          {isCompleted && <AppIcon name="Check" size={12} color={c.surface} strokeWidth={2.5} />}
        </Animated.View>
      </Pressable>

      {/* 내용 */}
      <View style={{ flex: 1 }}>
        <AppText
          variant="body"
          tone={isCompleted ? 'tertiary' : 'primary'}
          style={isCompleted ? { textDecorationLine: 'line-through' } : {}}
        >
          {todo.title}
        </AppText>
        {todo.dueDate && !isCompleted && (
          <AppText variant="caption" tone="disabled">
            {todo.dueDate}
          </AppText>
        )}
      </View>

      {/* 우선순위 점 */}
      {!isCompleted && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dotColor,
          }}
        />
      )}
    </Pressable>
  );
}
