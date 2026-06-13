import { useEffect, useState } from 'react';

import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

/** persist 스토어 rehydrate 완료 여부 */
export function useAppHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stores = [
      useFastingStore,
      useRoutineStore,
      useTodoStore,
      useUserStore,
      useSettingsStore,
      useRoutineCompletionStore,
    ];
    const unsubscribers = stores.map((store) =>
      store.persist.onFinishHydration(() => {
        if (stores.every((s) => s.persist.hasHydrated())) {
          setHydrated(true);
        }
      }),
    );

    if (stores.every((s) => s.persist.hasHydrated())) {
      setHydrated(true);
    }

    return () => unsubscribers.forEach((u) => u());
  }, []);

  return hydrated;
}
