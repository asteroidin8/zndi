import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useRoutineStore } from '@/stores/useRoutineStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { getWeekDayDots, getRoutineStreakDays, toDateStr } from '@/utils/homeDailyBoard';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';
import type { ChecklistItem, WidgetData } from './widgetDataBridge';
import { writeWidgetData } from './widgetDataBridge';

export function useWidgetSync() {
  const routines = useRoutineStore((s) => s.routines);
  const { isCompleted } = useRoutineCompletionStore();
  const todos = useTodoStore((s) => s.todos);
  const { status, startedAt, goalHours } = useFastingStore();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const now = new Date();
    const todayStr = toDateStr(now);

    const dots = getWeekDayDots(routines, isCompleted);
    const weeklyGrass = dots.map((d) => d.status === 'full');
    const streak = getRoutineStreakDays(routines, isCompleted);

    const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));
    const completedRoutines = todayRoutines.filter((r) => isCompleted(r.id, todayStr));
    const activeTodos = todos.filter((t) => !t.completedAt);

    const todayCompleted = completedRoutines.length + todos.filter((t) => !!t.completedAt).length;
    const todayTotal = todayRoutines.length + todos.length;

    const checklist: ChecklistItem[] = [
      ...todayRoutines.map((r) => ({
        id: r.id,
        title: r.name,
        done: isCompleted(r.id, todayStr),
        type: 'routine' as const,
      })),
      ...activeTodos.slice(0, 4).map((t) => ({
        id: t.id,
        title: t.title,
        done: false,
        type: 'todo' as const,
      })),
    ].slice(0, 6);

    const elapsedMs = status === 'fasting' && startedAt ? Date.now() - startedAt : 0;
    const goalMs = goalHours * 3_600_000;

    const data: WidgetData = {
      weeklyGrass,
      streak,
      todayCompleted: completedRoutines.length,
      todayTotal: todayRoutines.length + activeTodos.length,
      checklist,
      fasting: {
        status: status === 'fasting' ? 'fasting' : 'idle',
        goalHours,
        startedAt,
        elapsedMs,
        progressPercent: goalMs > 0 ? Math.min(Math.round((elapsedMs / goalMs) * 100), 100) : 0,
      },
    };

    writeWidgetData(data);
  }, [routines, isCompleted, todos, status, startedAt, goalHours]);
}
