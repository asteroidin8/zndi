import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { TodoPriorityBadge } from './TodoPriorityBadge';
import { useThemeColors } from '@/hooks/useThemeColors';
import { radius, size, spacing } from '@/constants/spacing';
import { formatDueDate, getDueDateColor } from '@/utils/dateFormat';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { HOME_TODO_MAX, selectHomeTodos } from '@/utils/homeTodos';

const MAX_ROUTINES = HOME_TODO_MAX;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  onRoutinePress?: () => void;
  onTodoPress?: () => void;
};

export function DailySummaryRow({ onRoutinePress, onTodoPress }: Props) {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { todos } = useTodoStore();
  const { isCompleted } = useRoutineCompletionStore();

  const today = getTodayDate();
  const todayDay = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const todayRoutines = routines
    .filter((r) => r.repeatDays.includes(todayDay))
    .sort((a, b) => {
      const aDone = isCompleted(a.id, today) ? 1 : 0;
      const bDone = isCompleted(b.id, today) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return a.order - b.order;
    });

  const activeTodos = todos.filter((t) => !t.completedAt);
  const homeTodos = selectHomeTodos(todos);

  const allRoutinesDone =
    todayRoutines.length > 0 && todayRoutines.every((r) => isCompleted(r.id, today));

  const hasRoutines = todayRoutines.length > 0;
  const hasTodos = activeTodos.length > 0;

  if (!hasRoutines && !hasTodos) return null;

  const cardStyle = {
    backgroundColor: c.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden' as const,
  };

  const headerRowStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.md,
  };

  const itemRowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm + 2,
  };

  return (
    <View style={{ gap: spacing.md }}>
      {hasRoutines && (
        <View style={cardStyle}>
          <Pressable
            onPress={onRoutinePress}
            style={headerRowStyle}
            accessibilityRole="button"
            accessibilityLabel="오늘의 루틴 보기"
          >
            <AppText
              variant="body"
              style={{
                fontWeight: '600',
                ...(allRoutinesDone ? { color: c.primary } : {}),
              }}
            >
              {allRoutinesDone ? '오늘 잔디 완료 ✓' : '오늘의 루틴'}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="caption" tone="tertiary">
                {todayRoutines.filter((r) => isCompleted(r.id, today)).length}/{todayRoutines.length}
              </AppText>
              <AppIcon name="ChevronRight" size={size.iconSm} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {todayRoutines.slice(0, MAX_ROUTINES).map((routine, index) => {
            const done = isCompleted(routine.id, today);
            return (
              <View key={routine.id}>
                <View
                  style={itemRowStyle}
                  accessibilityLabel={`${routine.name}${done ? ', 완료' : ', 미완료'}`}
                >
                  <View
                    style={{
                      width: size.checkboxSm,
                      height: size.checkboxSm,
                      borderRadius: size.checkboxSm / 2,
                      borderWidth: 1.5,
                      borderColor: done ? c.primary : c.borderStrong,
                      backgroundColor: done ? c.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(done
                        ? {
                            shadowColor: c.neonGlow,
                            shadowOpacity: 0.4,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 0 },
                            elevation: 2,
                          }
                        : {}),
                    }}
                  >
                    {done && <AppIcon name="Check" size={10} color={c.onPrimary} strokeWidth={3} />}
                  </View>
                  <AppText
                    variant="body"
                    style={{ flex: 1, ...(done ? { textDecorationLine: 'line-through' } : {}) }}
                    tone={done ? 'tertiary' : 'primary'}
                  >
                    {routine.name}
                  </AppText>
                </View>
                {index < Math.min(todayRoutines.length, MAX_ROUTINES) - 1 && (
                  <View style={{ height: 1, backgroundColor: c.border, marginLeft: spacing.card + size.checkboxSm + spacing.sm + 2 }} />
                )}
              </View>
            );
          })}

          {todayRoutines.length > MAX_ROUTINES && (
            <Pressable onPress={onRoutinePress} style={{ paddingHorizontal: spacing.card, paddingVertical: spacing.sm + 2 }}>
              <AppText variant="caption" tone="tertiary">
                +{todayRoutines.length - MAX_ROUTINES}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}

      {hasTodos && (
        <View style={cardStyle}>
          <Pressable
            onPress={onTodoPress}
            style={headerRowStyle}
            accessibilityRole="button"
            accessibilityLabel="오늘의 할일 보기"
          >
            <AppText variant="body" style={{ fontWeight: '600' }}>오늘의 할 일</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="caption" tone="tertiary">
                {activeTodos.length}개
              </AppText>
              <AppIcon name="ChevronRight" size={size.iconSm} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {homeTodos.map((todo, index) => (
            <View key={todo.id}>
              <View
                style={itemRowStyle}
                accessibilityLabel={`${todo.title}${todo.pinnedToHome ? ', 홈 고정' : ''}`}
              >
                <TodoPriorityBadge priority={todo.priority} />
                <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {todo.title}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  {todo.dueDate &&
                    (() => {
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
                  {todo.pinnedToHome && (
                    <View accessibilityLabel="홈 고정">
                      <AppIcon name="Pin" size={12} color={c.inkTertiary} />
                    </View>
                  )}
                </View>
              </View>
              {index < homeTodos.length - 1 && (
                <View style={{ height: 1, backgroundColor: c.border, marginLeft: spacing.card + 8 + spacing.sm + 2 }} />
              )}
            </View>
          ))}

          {activeTodos.length > homeTodos.length && (
            <Pressable onPress={onTodoPress} style={{ paddingHorizontal: spacing.card, paddingVertical: spacing.sm + 2 }}>
              <AppText variant="caption" tone="tertiary">
                +{activeTodos.length - homeTodos.length}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

