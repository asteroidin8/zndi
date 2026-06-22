import { useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { pushLocalToCloud, pullCloudToLocal } from '@/services/sync/cloudSync';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

const PUSH_DEBOUNCE_MS = 2500;

/** 로그인 시 로컬 변경을 debounce push (항상 ON) */
export function useAutoCloudSync() {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPullUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    if (initialPullUserRef.current !== userId) {
      initialPullUserRef.current = userId;
      const hasLocalData =
        useRoutineStore.getState().routines.length > 0 ||
        useTodoStore.getState().todos.length > 0 ||
        Object.keys(useRoutineCompletionStore.getState().completions).length > 0;
      if (!hasLocalData) {
        pullCloudToLocal(userId).then((res) => {
          if (res.error) console.warn('[zndi] pull failed:', res.error);
          else if (__DEV__) console.log('[zndi] pull complete');
        });
      } else {
        pushLocalToCloud(userId).then((res) => {
          if (res.error) console.warn('[zndi] initial push failed:', res.error);
          else if (__DEV__) console.log('[zndi] initial push complete');
        });
      }
    }

    const schedulePush = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        pushLocalToCloud(userId).then((res) => {
          if (res.error) console.warn('[zndi] push failed:', res.error);
          else if (__DEV__) console.log('[zndi] push complete');
        });
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
  }, [user?.id]);
}
