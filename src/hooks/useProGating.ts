import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';

import { useProStore } from '@/stores/useProStore';
import { fetchAppLimits } from '@/services/appLimitsService';

export function useProGating() {
  const isPro = useProStore((s) => s.isPro);
  const [lockVisible, setLockVisible] = useState(false);

  function requirePro(callback: () => void) {
    if (isPro) {
      callback();
      return;
    }
    setLockVisible(true);
  }

  const closeLock = useCallback(() => setLockVisible(false), []);
  const goToShop = useCallback(() => router.push('/settings/membership'), []);

  return { isPro, requirePro, lockVisible, closeLock, goToShop };
}

export const FREE_LIMITS = {
  routineGroups: 1,
  todoGroups: 1,
  boards: 3,
  boardMembers: 5,
} as const;

export const PRO_LIMITS = {
  boards: 7,
  boardMembers: 15,
} as const;

export function useServerLimits() {
  const isPro = useProStore((s) => s.isPro);
  const [limits, setLimits] = useState<{
    boards: number;
    boardMembers: number;
    routineGroups: number;
    todoGroups: number;
  }>({
    boards: isPro ? PRO_LIMITS.boards : FREE_LIMITS.boards,
    boardMembers: isPro ? PRO_LIMITS.boardMembers : FREE_LIMITS.boardMembers,
    routineGroups: FREE_LIMITS.routineGroups,
    todoGroups: FREE_LIMITS.todoGroups,
  });

  useEffect(() => {
    fetchAppLimits().then((l) => {
      setLimits({
        boards: isPro ? l.boards.pro : l.boards.free,
        boardMembers: isPro ? l.board_members.pro : l.board_members.free,
        routineGroups: isPro ? l.routine_groups.pro : l.routine_groups.free,
        todoGroups: isPro ? l.todo_groups.pro : l.todo_groups.free,
      });
    });
  }, [isPro]);

  return limits;
}
