import { useEffect, useRef } from 'react';

import { BOARD_PROGRESS_DEBOUNCE_MS } from '@/constants/timing';
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

let cachedStreak = { date: '', value: 0, baseKey: '' };

function computeDailyProgress() {
  const routines = useRoutineStore.getState().routines.filter((r) => !r.deletedAt);
  const todos = useTodoStore.getState().todos.filter((t) => !t.deletedAt && !t.archivedDate);
  const isCompleted = useRoutineCompletionStore.getState().isCompleted;

  const now = new Date();
  const todayStr = localDateStr(now);

  const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));
  const routineCompleted = todayRoutines.filter((r) => isCompleted(r.id, todayStr)).length;
  const routineTotal = todayRoutines.length;

  const todoCompleted = todos.filter((t) => t.completedAt !== null).length;
  const todoTotal = todos.length;

  const streakBaseKey = `${todayStr}:${routineCompleted}/${routineTotal}`;
  let streak: number;
  if (cachedStreak.date === todayStr && cachedStreak.baseKey === streakBaseKey) {
    streak = cachedStreak.value;
  } else {
    streak = 0;
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
    cachedStreak = { date: todayStr, value: streak, baseKey: streakBaseKey };
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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const debouncedSync = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(syncProgress, BOARD_PROGRESS_DEBOUNCE_MS);
    };

    syncProgress();

    const unsubs = [
      useRoutineStore.subscribe((state, prev) => {
        if (state.routines !== prev.routines) debouncedSync();
      }),
      useTodoStore.subscribe((state, prev) => {
        if (state.todos !== prev.todos) debouncedSync();
      }),
      useRoutineCompletionStore.subscribe((state, prev) => {
        if (state.completions !== prev.completions) debouncedSync();
      }),
      useBoardStore.subscribe((state, prev) => {
        if (state.boards !== prev.boards) debouncedSync();
      }),
    ];

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      for (const unsub of unsubs) unsub();
    };
  }, [user?.id]);
}
