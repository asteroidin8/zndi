import React from 'react';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { useRoutineStore } from '@/stores/useRoutineStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';
import { localDateStr } from '@/utils/dateFormat';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';
import type { ChecklistItem, WidgetData } from './widgetDataBridge';
import { writeWidgetData } from './widgetDataBridge';
import { GrassWidget } from './GrassWidget';
import { ChecklistWidget } from './ChecklistWidget';
import { FastingWidget } from './FastingWidget';

function buildWidgetData(
  routines: ReturnType<typeof useRoutineStore.getState>['routines'],
  isCompleted: ReturnType<typeof useRoutineCompletionStore.getState>['isCompleted'],
  todos: ReturnType<typeof useTodoStore.getState>['todos'],
  status: string,
  startedAt: number | null,
  goalHours: number,
): WidgetData {
  const now = new Date();
  const todayStr = localDateStr(now);
  const streak = getRoutineStreakDays(routines, isCompleted);

  const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));
  const completedRoutines = todayRoutines.filter((r) => isCompleted(r.id, todayStr));
  const activeTodos = todos.filter((t) => !t.archivedDate);
  const completedTodos = activeTodos.filter((t) => t.completedAt !== null);

  const routineCompleted = completedRoutines.length;
  const routineTotal = todayRoutines.length;
  const todoCompleted = completedTodos.length;
  const todoTotal = activeTodos.length;

  const checklist: ChecklistItem[] = [
    ...todayRoutines.slice(0, 3).map((r) => ({
      id: r.id,
      title: r.name,
      done: isCompleted(r.id, todayStr),
      type: 'routine' as const,
    })),
    ...activeTodos
      .filter((t) => !t.completedAt)
      .slice(0, 3)
      .map((t) => ({
        id: t.id,
        title: t.title,
        done: false,
        type: 'todo' as const,
      })),
  ].slice(0, 5);

  const elapsedMs = status === 'fasting' && startedAt ? Date.now() - startedAt : 0;
  const goalMs = goalHours * 3_600_000;

  return {
    streak,
    todayCompleted: routineCompleted + todoCompleted,
    todayTotal: routineTotal + todoTotal,
    routineCompleted,
    routineTotal,
    todoCompleted,
    todoTotal,
    checklist,
    fasting: {
      status: status === 'fasting' ? 'fasting' : 'idle',
      goalHours,
      startedAt,
      elapsedMs,
      progressPercent: goalMs > 0 ? Math.min(Math.round((elapsedMs / goalMs) * 100), 100) : 0,
    },
  };
}

export function useWidgetSync() {
  const routines = useRoutineStore((s) => s.routines);
  const { isCompleted } = useRoutineCompletionStore();
  const todos = useTodoStore((s) => s.todos);
  const { status, startedAt, goalHours } = useFastingStore();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const data = buildWidgetData(routines, isCompleted, todos, status, startedAt, goalHours);

    void (async () => {
      await writeWidgetData(data);
      try {
        await requestWidgetUpdate({
          widgetName: 'GrassWidget',
          renderWidget: () => ({
            light: React.createElement(GrassWidget, { data, theme: 'light' }),
            dark: React.createElement(GrassWidget, { data, theme: 'dark' }),
          }),
        });
      } catch { /* not placed */ }
      try {
        await requestWidgetUpdate({
          widgetName: 'ChecklistWidget',
          renderWidget: () => ({
            light: React.createElement(ChecklistWidget, { data, theme: 'light' }),
            dark: React.createElement(ChecklistWidget, { data, theme: 'dark' }),
          }),
        });
      } catch { /* not placed */ }
      try {
        await requestWidgetUpdate({
          widgetName: 'FastingWidget',
          renderWidget: () => ({
            light: React.createElement(FastingWidget, { data, theme: 'light' }),
            dark: React.createElement(FastingWidget, { data, theme: 'dark' }),
          }),
        });
      } catch { /* not placed */ }
    })();
  }, [routines, isCompleted, todos, status, startedAt, goalHours]);
}
