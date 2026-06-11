import { Pressable, View } from 'react-native';

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

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14 }}
    >
      {/* 체크박스 */}
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1.5,
          borderColor: isCompleted ? c.ink : c.borderStrong,
          backgroundColor: isCompleted ? c.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isCompleted && <AppIcon name="Check" size={12} color={c.surface} strokeWidth={2.5} />}
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
