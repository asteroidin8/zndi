import { Pressable, View } from 'react-native';

import { CompletionCheckbox } from './CompletionCheckbox';
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

  function handleToggle() {
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        gap: 14,
        minHeight: 48,
        opacity: isCompleted ? 0.72 : 1,
      }}
    >
      <CompletionCheckbox
        checked={isCompleted}
        onToggle={handleToggle}
        label={`${todo.title} 완료 토글`}
        shape="circle"
      />

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
            color={todo.pinnedToHome ? c.primary : c.inkDisabled}
          />
        </Pressable>
      )}
      {!isCompleted && !onToggleHomePin && <TodoPriorityBadge priority={todo.priority} />}
    </Pressable>
  );
}
