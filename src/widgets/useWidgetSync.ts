import React, { useEffect, useRef } from 'react';
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
    ...todayRoutines
      .filter((r) => !isCompleted(r.id, todayStr))
      .slice(0, 2)
      .map((r) => ({
        id: r.id,
        title: r.name,
        done: false,
        type: 'routine' as const,
      })),
    ...activeTodos
      .filter((t) => !t.completedAt)
      .slice(0, 2)
      .map((t) => ({
        id: t.id,
        title: t.title,
        done: false,
        type: 'todo' as const,
      })),
  ];

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

async function pushUpdate(data: WidgetData) {
  await writeWidgetData(data);
  const widgets = ['GrassWidget', 'ChecklistWidget', 'FastingWidget'] as const;
  const components = {
    GrassWidget,
    ChecklistWidget,
    FastingWidget,
  } as const;
  for (const name of widgets) {
    try {
      const Widget = components[name];
      await requestWidgetUpdate({
        widgetName: name,
        renderWidget: () => ({
          light: React.createElement(Widget, { data, theme: 'light' as const }),
          dark: React.createElement(Widget, { data, theme: 'dark' as const }),
        }),
      });
    } catch { /* widget not placed */ }
  }
}

export function useWidgetSync() {
  const routines = useRoutineStore((s) => s.routines);
  const { isCompleted } = useRoutineCompletionStore();
  const todos = useTodoStore((s) => s.todos);
  const { status, startedAt, goalHours } = useFastingStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const data = buildWidgetData(routines, isCompleted, todos, status, startedAt, goalHours);
    void pushUpdate(data);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === 'fasting') {
      timerRef.current = setInterval(() => {
        const fresh = buildWidgetData(
          useRoutineStore.getState().routines,
          useRoutineCompletionStore.getState().isCompleted,
          useTodoStore.getState().todos,
          useFastingStore.getState().status,
          useFastingStore.getState().startedAt,
          useFastingStore.getState().goalHours,
        );
        void pushUpdate(fresh);
      }, 60_000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [routines, isCompleted, todos, status, startedAt, goalHours]);
}
