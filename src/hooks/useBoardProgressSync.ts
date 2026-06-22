import { useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { isCloudSyncSuppressed } from '@/services/sync/cloudSyncGuard';
import { useBoardStore } from '@/stores/useBoardStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { pushDailyProgress } from '@/services/board/boardService';
import { pushPersonalProgress } from '@/services/social/followService';
import { localDateStr } from '@/utils/dateFormat';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';

function computeDailyProgress() {
  const routines = useRoutineStore.getState().routines;
  const todos = useTodoStore.getState().todos;
  const isCompleted = useRoutineCompletionStore.getState().isCompleted;

  const now = new Date();
  const todayStr = localDateStr(now);

  const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));
  const routineCompleted = todayRoutines.filter((r) => isCompleted(r.id, todayStr)).length;
  const routineTotal = todayRoutines.length;

  const activeTodos = todos.filter((t) => !t.archivedDate);
  const todoCompleted = activeTodos.filter((t) => t.completedAt !== null).length;
  const todoTotal = activeTodos.length;

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    const dayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, d));
    if (dayRoutines.length === 0) continue;
    const allDone = dayRoutines.every((r) => isCompleted(r.id, ds));
    if (allDone) streak++;
    else break;
  }

  const progressData = {
    routineCompleted,
    routineTotal,
    todoCompleted,
    todoTotal,
    streak,
  };

  const key = `${todayStr}:${routineCompleted}/${routineTotal}:${todoCompleted}/${todoTotal}:${streak}`;
  return { todayStr, key, progressData };
}

export function useBoardProgressSync() {
  const { user } = useAuth();
  const lastPushed = useRef('');

  useEffect(() => {
    if (!user?.id) return;

    const syncProgress = () => {
      if (isCloudSyncSuppressed()) return;

      const { todayStr, key, progressData } = computeDailyProgress();
      if (key === lastPushed.current) return;
      lastPushed.current = key;

      void pushPersonalProgress(user.id, todayStr, progressData);

      const boards = useBoardStore.getState().boards;
      for (const board of boards) {
        void pushDailyProgress(user.id, board.id, todayStr, progressData);
      }
    };

    syncProgress();

    const unsubs = [
      useRoutineStore.subscribe(syncProgress),
      useTodoStore.subscribe(syncProgress),
      useRoutineCompletionStore.subscribe(syncProgress),
      useBoardStore.subscribe((state, prev) => {
        if (state.boards !== prev.boards) syncProgress();
      }),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [user?.id]);
}
