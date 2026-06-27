import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isCloudSyncSuppressed } from '@/services/sync/cloudSyncGuard';
import { pushLocalToCloud, pullCloudToLocal } from '@/services/sync/cloudSync';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

import { PUSH_DEBOUNCE_MS } from '@/constants/timing';

function waitForHydration(): Promise<void> {
  const stores = [
    useRoutineStore.persist,
    useTodoStore.persist,
    useRoutineCompletionStore.persist,
    useFastingStore.persist,
    useUserStore.persist,
  ];
  return Promise.all(
    stores.map((p) =>
      p.hasHydrated()
        ? Promise.resolve()
        : new Promise<void>((resolve) => p.onFinishHydration(() => resolve())),
    ),
  ).then(() => {});
}

/** 로그인 시 로컬 변경을 debounce push (항상 ON) */
export function useAutoCloudSync() {
  const { user, configured } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPullUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!__DEV__) return;
    console.log(
      '[zndi:sync] configured:',
      configured,
      'supabase:',
      isSupabaseConfigured(),
      'user:',
      user?.id ?? 'null',
    );
  }, [configured, user?.id]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      if (__DEV__) console.log('[zndi:sync] skip — no user');
      initialPullUserRef.current = null;
      return;
    }

    if (initialPullUserRef.current !== userId) {
      initialPullUserRef.current = userId;
      waitForHydration().then(() => {
        InteractionManager.runAfterInteractions(() => {
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
        });
      });
    }

    const dirtyStores = new Set<string>();

    const schedulePush = (storeName: string) => {
      if (isCloudSyncSuppressed()) return;
      dirtyStores.add(storeName);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const stores = new Set(dirtyStores);
        dirtyStores.clear();
        pushLocalToCloud(userId, stores).then((res) => {
          if (res.error) console.warn('[zndi] push failed:', res.error);
          else if (__DEV__) console.log('[zndi] push complete (stores:', [...stores].join(','), ')');
        });
      }, PUSH_DEBOUNCE_MS);
    };

    let prevFastingRecordsLen = useFastingStore.getState().records.length;
    const unsubs = [
      useUserStore.subscribe((state, prev) => {
        if (state.profile !== prev.profile || state.weightRecords !== prev.weightRecords) {
          schedulePush('user');
        }
      }),
      useRoutineStore.subscribe((state, prev) => {
        if (state.routines !== prev.routines || state.groups !== prev.groups) {
          schedulePush('routines');
        }
      }),
      useTodoStore.subscribe((state, prev) => {
        if (state.todos !== prev.todos || state.groups !== prev.groups) {
          schedulePush('todos');
        }
      }),
      useRoutineCompletionStore.subscribe((state, prev) => {
        if (state.completions !== prev.completions) schedulePush('completions');
      }),
      useFastingStore.subscribe((state) => {
        if (state.records.length !== prevFastingRecordsLen) {
          prevFastingRecordsLen = state.records.length;
          schedulePush('fasting');
        }
      }),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.id]);
}
