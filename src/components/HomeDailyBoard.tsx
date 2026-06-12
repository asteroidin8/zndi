import { View } from 'react-native';

import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import {
  getActiveTodoCount,
  getRoutineProgressForDate,
  getRoutineStreakDays,
  getTodaySummaryMessage,
  getTodosCompletedTodayCount,
  getWeekDayDots,
  toDateStr,
  type DayDotStatus,
} from '@/utils/homeDailyBoard';

function dotColor(status: DayDotStatus, c: ReturnType<typeof useThemeColors>, isToday: boolean) {
  switch (status) {
    case 'full':
      return c.ink;
    case 'partial':
      return c.inkTertiary;
    case 'empty':
      return isToday ? c.borderStrong : c.surfaceMuted;
    case 'none':
      return c.border;
  }
}

export function HomeDailyBoard() {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { todos } = useTodoStore();
  const { isCompleted } = useRoutineCompletionStore();

  const todayStr = toDateStr(new Date());
  const todayDay = new Date().getDay();
  const { completed: routineCompleted, total: routineTotal } = getRoutineProgressForDate(
    todayStr,
    todayDay,
    routines,
    isCompleted,
  );

  const activeTodos = getActiveTodoCount(todos);
  const todosCompletedToday = getTodosCompletedTodayCount(todos);
  const weekDots = getWeekDayDots(routines, isCompleted);
  const streakDays = getRoutineStreakDays(routines, isCompleted);

  const summary = getTodaySummaryMessage({
    routineCompleted,
    routineTotal,
    activeTodos,
    todosCompletedToday,
  });

  const routineLine =
    routineTotal > 0 ? `루틴 ${routineCompleted}/${routineTotal}` : '오늘 루틴 없음';
  const todoLine =
    activeTodos > 0
      ? `할 일 ${activeTodos}개 남음${todosCompletedToday > 0 ? ` · 오늘 ${todosCompletedToday}개 완료` : ''}`
      : todosCompletedToday > 0
        ? `할 일 오늘 ${todosCompletedToday}개 완료`
        : '할 일 없음';

  return (
    <View
      style={{
        backgroundColor: c.surfaceSubtle,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        padding: 18,
        gap: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <AppText variant="body" style={{ fontWeight: '700' }}>
          오늘의 보드
        </AppText>
        <AppText variant="caption" tone="secondary">
          {summary}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <AppText variant="caption" tone="tertiary">
            {routineLine}
          </AppText>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <AppText variant="caption" tone="tertiary">
            {todoLine}
          </AppText>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="caption" tone="tertiary">
            최근 7일
          </AppText>
          {streakDays > 0 && (
            <AppText variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
              루틴 {streakDays}일 연속
            </AppText>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {weekDots.map((dot) => {
            const isToday = dot.dateStr === todayStr;
            return (
              <View key={dot.dateStr} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                <View
                  style={{
                    width: isToday ? 14 : 12,
                    height: isToday ? 14 : 12,
                    borderRadius: 7,
                    backgroundColor:
                      dot.status === 'full' || dot.status === 'partial'
                        ? dotColor(dot.status, c, isToday)
                        : dot.status === 'none'
                          ? 'transparent'
                          : 'transparent',
                    borderWidth: dot.status === 'none' || dot.status === 'empty' ? 1.5 : 0,
                    borderColor: dotColor(dot.status, c, isToday),
                  }}
                />
                <AppText
                  variant="caption"
                  tone={isToday ? 'primary' : 'disabled'}
                  style={isToday ? { fontWeight: '700' } : {}}
                >
                  {dot.weekdayLabel}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
