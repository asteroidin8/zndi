import { View } from 'react-native';

import { AppText } from './AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import {
  getActiveTodoCount,
  getRoutineProgressForDate,
  getRoutineStreakDays,
  getWeekDayDots,
  toDateStr,
  type DayDotStatus,
} from '@/utils/homeDailyBoard';

function dotColor(status: DayDotStatus, c: ReturnType<typeof useThemeColors>) {
  switch (status) {
    case 'full':
      return c.ink;
    case 'partial':
      return c.inkTertiary;
    case 'empty':
      return c.borderStrong;
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
  const weekDots = getWeekDayDots(routines, isCompleted);
  const streakDays = getRoutineStreakDays(routines, isCompleted);

  const parts: string[] = [];
  if (routineTotal > 0) parts.push(`루틴 ${routineCompleted}/${routineTotal}`);
  if (activeTodos > 0) parts.push(`할 일 ${activeTodos}`);
  const summaryLine = parts.length > 0 ? parts.join(' · ') : '오늘 일정 없음';

  return (
    <View
      style={{
        backgroundColor: c.surfaceSubtle,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.border,
        paddingHorizontal: spacing.item,
        paddingVertical: spacing.card,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <AppText variant="caption" tone="tertiary" style={{ flex: 1 }}>
          {summaryLine}
        </AppText>
        {streakDays > 0 && (
          <AppText variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
            {streakDays}일 연속
          </AppText>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {weekDots.map((dot) => {
          const isToday = dot.dateStr === todayStr;
          const filled = dot.status === 'full' || dot.status === 'partial';
          const dotSize = isToday ? 12 : 10;
          return (
            <View key={dot.dateStr} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: filled ? dotColor(dot.status, c) : 'transparent',
                  borderWidth: filled ? 0 : 1.5,
                  borderColor: dotColor(dot.status, c),
                }}
              />
              <AppText
                variant="caption"
                tone={isToday ? 'secondary' : 'tertiary'}
                style={{ fontWeight: isToday ? '600' : '400' }}
              >
                {dot.weekdayLabel}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}
