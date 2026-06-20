import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Routine } from '@/types';

export type { Routine, Weekday } from '@/types';

type RoutineStore = {
  routines: Routine[];
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;
  reorderRoutines: (ordered: Routine[]) => void;
};

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set) => ({
      routines: [],
      addRoutine: (routine) =>
        set((s) => ({ routines: [...s.routines, routine] })),
      updateRoutine: (id, updates) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      removeRoutine: (id) =>
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      reorderRoutines: (ordered) =>
        set({ routines: ordered.map((r, i) => ({ ...r, order: i })) }),
    }),
    {
      name: 'routine-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
