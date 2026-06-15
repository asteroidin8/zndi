import { useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { pushLocalToCloud, pullCloudToLocal } from '@/services/sync/cloudSync';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

const PUSH_DEBOUNCE_MS = 2500;

/** 로그인 + 자동 동기화 ON 시 로컬 변경을 debounce push */
export function useAutoCloudSync() {
  const { user } = useAuth();
  const autoSyncEnabled = useSettingsStore((s) => s.cloudAutoSyncEnabled);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPullUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId || !autoSyncEnabled) return;

    if (initialPullUserRef.current !== userId) {
      initialPullUserRef.current = userId;
      const hasLocalData =
        useRoutineStore.getState().routines.length > 0 ||
        useTodoStore.getState().todos.length > 0 ||
        Object.keys(useRoutineCompletionStore.getState().completions).length > 0;
      if (!hasLocalData) {
        void pullCloudToLocal(userId);
      }
    }

    const schedulePush = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void pushLocalToCloud(userId);
      }, PUSH_DEBOUNCE_MS);
    };

    const unsubs = [
      useUserStore.subscribe(schedulePush),
      useRoutineStore.subscribe(schedulePush),
      useTodoStore.subscribe(schedulePush),
      useRoutineCompletionStore.subscribe(schedulePush),
      useFastingStore.subscribe(schedulePush),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.id, autoSyncEnabled]);
}
