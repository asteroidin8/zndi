import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { useProStore } from '@/stores/useProStore';

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
  const goToShop = useCallback(() => router.push('/settings'), []);

  return { isPro, requirePro, lockVisible, closeLock, goToShop };
}

export const FREE_LIMITS = {
  routineGroups: 1,
  todoGroups: 1,
  boards: 1,
} as const;
