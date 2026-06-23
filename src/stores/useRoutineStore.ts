import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Routine, RoutineGroup } from '@/types';

export type { Routine, RoutineGroup, Weekday, RepeatType } from '@/types';

type RoutineStore = {
  routines: Routine[];
  groups: RoutineGroup[];
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;
  removeRoutines: (ids: string[]) => void;
  reorderRoutines: (ordered: Routine[]) => void;
  addGroup: (group: RoutineGroup) => void;
  updateGroup: (id: string, updates: Partial<RoutineGroup>) => void;
  removeGroup: (id: string) => void;
  reorderGroups: (ordered: RoutineGroup[]) => void;
  toggleGroupCollapsed: (id: string) => void;
  moveRoutineToGroup: (routineId: string, groupId: string | null) => void;
  reorderGroupRoutines: (groupId: string, ordered: Routine[]) => void;
  batchUpdateRoutines: (updates: { id: string; groupId: string | null; order: number }[]) => void;
};

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set) => ({
      routines: [],
      groups: [],

      addRoutine: (routine) =>
        set((s) => ({ routines: [...s.routines, routine] })),

      updateRoutine: (id, updates) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      removeRoutine: (id) =>
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      removeRoutines: (ids) =>
        set((s) => ({ routines: s.routines.filter((r) => !ids.includes(r.id)) })),

      reorderRoutines: (ordered) =>
        set({ routines: ordered.map((r, i) => ({ ...r, order: i })) }),

      addGroup: (group) =>
        set((s) => ({ groups: [...s.groups, group] })),

      updateGroup: (id, updates) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      removeGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          routines: s.routines.map((r) =>
            (r.groupId ?? null) === id ? { ...r, groupId: null } : r,
          ),
        })),

      reorderGroups: (ordered) =>
        set({ groups: ordered.map((g, i) => ({ ...g, order: i })) }),

      toggleGroupCollapsed: (id) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)),
        })),

      moveRoutineToGroup: (routineId, groupId) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === routineId ? { ...r, groupId } : r)),
        })),

      reorderGroupRoutines: (groupId, ordered) =>
        set((s) => ({
          routines: [
            ...s.routines.filter((r) => (r.groupId ?? null) !== groupId),
            ...ordered.map((r, i) => ({ ...r, order: i })),
          ],
        })),

      batchUpdateRoutines: (updates) =>
        set((s) => ({
          routines: s.routines.map((r) => {
            const u = updates.find((up) => up.id === r.id);
            return u ? { ...r, groupId: u.groupId, order: u.order } : r;
          }),
        })),
    }),
    {
      name: 'routine-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 1) {
          const routines = (state.routines as Record<string, unknown>[]) ?? [];
          state.routines = routines.map((r) => ({ ...r, groupId: r.groupId ?? null }));
          state.groups = state.groups ?? [];
        }
        if (version < 2) {
          const routines = (state.routines as Record<string, unknown>[]) ?? [];
          state.routines = routines.map((r) => ({
            ...r,
            repeatType: r.repeatType ?? 'weekly',
            monthDates: r.monthDates ?? [],
          }));
        }
        if (version < 3) {
          const routines = (state.routines as Record<string, unknown>[]) ?? [];
          state.routines = routines.map((r) => ({ ...r, section: r.section ?? null }));
        }
        if (version < 4) {
          const routines = (state.routines as Record<string, unknown>[]) ?? [];
          state.routines = routines.map((r) => ({ ...r, repeatInterval: r.repeatInterval ?? 1 }));
        }
        return state as RoutineStore;
      },
    },
  ),
);
