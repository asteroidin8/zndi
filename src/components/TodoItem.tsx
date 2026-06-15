import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { TodoPriorityBadge } from './TodoPriorityBadge';
import { useThemeColors } from '@/hooks/useThemeColors';
import { feedbackComplete, feedbackUncomplete } from '@/utils/microFeedback';
import type { Todo } from '@/stores/useTodoStore';
import { formatDueDate, getDueDateColor } from '@/utils/dateFormat';

type Props = {
  todo: Todo;
  onToggle?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
  onToggleHomePin?: () => void;
};

export function TodoItem({ todo, onToggle, onLongPress, onPress, onToggleHomePin }: Props) {
  const c = useThemeColors();
  const isCompleted = !!todo.completedAt;
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
    if (isCompleted) feedbackUncomplete();
    else feedbackComplete();
    onToggle?.();
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      accessibilityRole="button"
      accessibilityLabel={`${todo.title}${isCompleted ? ', 완료됨' : ''}`}
      accessibilityHint="길게 눌러 순서 변경"
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14, minHeight: 48 }}
    >
      <Pressable
        onPress={handleToggle}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={`${todo.title} 완료 토글`}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 11,
              borderWidth: 1.5,
              borderColor: isCompleted ? c.primary : c.borderStrong,
              backgroundColor: isCompleted ? c.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            },
            checkboxStyle,
          ]}
        >
          {isCompleted && <AppIcon name="Check" size={12} color={c.onPrimary} strokeWidth={2.5} />}
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
        {todo.dueDate && !isCompleted && (() => {
          const { label, urgency } = formatDueDate(todo.dueDate);
          const color = getDueDateColor(urgency, c);
          return (
            <AppText
              variant="caption"
              style={color ? { color } : undefined}
              tone={color ? undefined : 'disabled'}
            >
              {label}
            </AppText>
          );
        })()}
      </View>

      {/* 홈 고정 / 우선순위 */}
      {!isCompleted && onToggleHomePin && (
        <Pressable
          onPress={onToggleHomePin}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={todo.pinnedToHome ? '홈 고정 해제' : '홈에 고정'}
        >
          <AppIcon
            name={todo.pinnedToHome ? 'Pin' : 'PinOff'}
            size={16}
            color={todo.pinnedToHome ? c.ink : c.inkDisabled}
          />
        </Pressable>
      )}
      {!isCompleted && !onToggleHomePin && <TodoPriorityBadge priority={todo.priority} />}
    </Pressable>
  );
}
