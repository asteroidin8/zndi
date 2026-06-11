import { View } from 'react-native';

import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function DailySummaryRow() {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { todos } = useTodoStore();

  const today = getTodayDate();
  const todayDay = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const todayRoutines = routines.filter((r) => r.repeatDays.includes(todayDay));
  // 완료 수는 추후 routineCompletions DB 연동 후 실제 값으로 교체
  const completedRoutines = 0;

  const todayTodos = todos.filter((t) => {
    if (t.completedAt) return false;
    if (!t.dueDate) return true;
    return t.dueDate === today;
  });

  const summaryText = [
    todayRoutines.length > 0
      ? `루틴 ${completedRoutines}/${todayRoutines.length}`
      : null,
    todayTodos.length > 0 ? `투두 ${todayTodos.length}개` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  if (!summaryText) return null;

  return (
    <View
      style={{
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      <AppText variant="caption" tone="tertiary">
        {summaryText}
      </AppText>
    </View>
  );
}
