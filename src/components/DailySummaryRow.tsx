import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';

const MAX_ITEMS = 3;

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

  const today = getTodayDate();
  const todayDay = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const todayRoutines = routines
    .filter((r) => r.repeatDays.includes(todayDay))
    .sort((a, b) => a.order - b.order);

  const activeTodos = todos
    .filter((t) => {
      if (t.completedAt) return false;
      if (!t.dueDate) return true;
      return t.dueDate === today;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, mid: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || a.order - b.order;
    });

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
      {/* 오늘의 루틴 */}
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
          >
            <AppText variant="label">오늘의 루틴</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText variant="caption" tone="tertiary">
                {todayRoutines.length}개
              </AppText>
              <AppIcon name="ChevronRight" size={14} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {todayRoutines.slice(0, MAX_ITEMS).map((routine, index) => (
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
                    borderColor: c.borderStrong,
                  }}
                />
                <AppText variant="body" style={{ flex: 1 }}>
                  {routine.name}
                </AppText>
              </View>
              {index < Math.min(todayRoutines.length, MAX_ITEMS) - 1 && (
                <View style={{ height: 1, backgroundColor: c.border, marginLeft: 44 }} />
              )}
            </View>
          ))}

          {todayRoutines.length > MAX_ITEMS && (
            <Pressable
              onPress={onRoutinePress}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <AppText variant="caption" tone="tertiary">
                +{todayRoutines.length - MAX_ITEMS}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}

      {/* 오늘의 투두 */}
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
          >
            <AppText variant="label">오늘의 할 일</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText variant="caption" tone="tertiary">
                {activeTodos.length}개
              </AppText>
              <AppIcon name="ChevronRight" size={14} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {activeTodos.slice(0, MAX_ITEMS).map((todo, index) => (
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
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: priorityColor[todo.priority],
                  }}
                />
                <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {todo.title}
                </AppText>
              </View>
              {index < Math.min(activeTodos.length, MAX_ITEMS) - 1 && (
                <View style={{ height: 1, backgroundColor: c.border, marginLeft: 34 }} />
              )}
            </View>
          ))}

          {activeTodos.length > MAX_ITEMS && (
            <Pressable
              onPress={onTodoPress}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <AppText variant="caption" tone="tertiary">
                +{activeTodos.length - MAX_ITEMS}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
