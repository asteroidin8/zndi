import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
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

  const priorityColor: Record<string, string> = {
    high: c.ink,
    mid: c.inkTertiary,
    low: c.inkDisabled,
  };

  return (
    <View style={{ gap: 12 }}>
      {hasRoutines && (
        <View
          style={{
            backgroundColor: c.surfaceSubtle,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.border,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={onRoutinePress}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="오늘의 루틴 보기"
          >
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {allRoutinesDone ? '오늘 루틴 완료' : '오늘의 루틴'}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText variant="caption" tone="tertiary">
                {todayRoutines.filter((r) => isCompleted(r.id, today)).length}/{todayRoutines.length}
              </AppText>
              <AppIcon name="ChevronRight" size={14} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {todayRoutines.slice(0, MAX_ROUTINES).map((routine, index) => {
            const done = isCompleted(routine.id, today);
            return (
              <View key={routine.id}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1.5,
                      borderColor: done ? c.ink : c.borderStrong,
                      backgroundColor: done ? c.ink : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {done && <AppIcon name="Check" size={10} color={c.surface} strokeWidth={3} />}
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
                  <View style={{ height: 1, backgroundColor: c.border, marginLeft: 44 }} />
                )}
              </View>
            );
          })}

          {todayRoutines.length > MAX_ROUTINES && (
            <Pressable onPress={onRoutinePress} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <AppText variant="caption" tone="tertiary">
                +{todayRoutines.length - MAX_ROUTINES}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}

      {hasTodos && (
        <View
          style={{
            backgroundColor: c.surfaceSubtle,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.border,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={onTodoPress}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="오늘의 할일 보기"
          >
            <AppText variant="body" style={{ fontWeight: '600' }}>오늘의 할 일</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText variant="caption" tone="tertiary">
                {activeTodos.length}개
              </AppText>
              <AppIcon name="ChevronRight" size={14} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {homeTodos.map((todo, index) => (
            <View key={todo.id}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  gap: 10,
                }}
              >
                {todo.pinnedToHome ? (
                  <AppIcon name="Pin" size={12} color={c.inkTertiary} />
                ) : (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: priorityColor[todo.priority],
                    }}
                  />
                )}
                <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {todo.title}
                </AppText>
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
              </View>
              {index < homeTodos.length - 1 && (
                <View style={{ height: 1, backgroundColor: c.border, marginLeft: 34 }} />
              )}
            </View>
          ))}

          {activeTodos.length > homeTodos.length && (
            <Pressable onPress={onTodoPress} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
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
