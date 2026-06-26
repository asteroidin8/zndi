import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DELETED_RETENTION_DAYS } from '@/constants/dataRetention';
import { markDirty } from '@/services/sync/dirtyTracker';
import type { Routine, RoutineGroup } from '@/types';

export type { Routine, RoutineGroup, Weekday, RepeatType } from '@/types';

type RoutineStore = {
  routines: Routine[];
  groups: RoutineGroup[];
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;
  removeRoutines: (ids: string[]) => void;
  undoRemoveRoutine: (id: string) => void;
  purgeOldDeleted: () => void;
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

      addRoutine: (routine) => {
        markDirty('routines', routine.id);
        set((s) => ({ routines: [...s.routines, routine] }));
      },

      updateRoutine: (id, updates) => {
        markDirty('routines', id);
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      removeRoutine: (id) => {
        markDirty('routines', id);
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, deletedAt: Date.now() } : r,
          ),
        }));
      },

      removeRoutines: (ids) => {
        for (const id of ids) markDirty('routines', id);
        set((s) => ({
          routines: s.routines.map((r) =>
            ids.includes(r.id) ? { ...r, deletedAt: Date.now() } : r,
          ),
        }));
      },

      undoRemoveRoutine: (id) => {
        markDirty('routines', id);
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, deletedAt: undefined } : r,
          ),
        }));
      },

      purgeOldDeleted: () => {
        const cutoff = Date.now() - DELETED_RETENTION_DAYS * 86_400_000;
        set((s) => ({
          routines: s.routines.filter(
            (r) => !r.deletedAt || r.deletedAt > cutoff,
          ),
        }));
      },

      reorderRoutines: (ordered) => {
        for (const r of ordered) markDirty('routines', r.id);
        set({ routines: ordered.map((r, i) => ({ ...r, order: i })) });
      },

      addGroup: (group) => {
        markDirty('routine_groups', group.id);
        set((s) => ({ groups: [...s.groups, group] }));
      },

      updateGroup: (id, updates) => {
        markDirty('routine_groups', id);
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      removeGroup: (id) => {
        markDirty('routine_groups', id);
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          routines: s.routines.map((r) =>
            (r.groupId ?? null) === id ? { ...r, groupId: null } : r,
          ),
        }));
      },

      reorderGroups: (ordered) => {
        for (const g of ordered) markDirty('routine_groups', g.id);
        set({ groups: ordered.map((g, i) => ({ ...g, order: i })) });
      },

      toggleGroupCollapsed: (id) => {
        markDirty('routine_groups', id);
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)),
        }));
      },

      moveRoutineToGroup: (routineId, groupId) => {
        markDirty('routines', routineId);
        set((s) => ({
          routines: s.routines.map((r) => (r.id === routineId ? { ...r, groupId } : r)),
        }));
      },

      reorderGroupRoutines: (groupId, ordered) => {
        for (const r of ordered) markDirty('routines', r.id);
        set((s) => ({
          routines: [
            ...s.routines.filter((r) => (r.groupId ?? null) !== groupId),
            ...ordered.map((r, i) => ({ ...r, order: i })),
          ],
        }));
      },

      batchUpdateRoutines: (updates) => {
        for (const u of updates) markDirty('routines', u.id);
        set((s) => ({
          routines: s.routines.map((r) => {
            const u = updates.find((up) => up.id === r.id);
            return u ? { ...r, groupId: u.groupId, order: u.order } : r;
          }),
        }));
      },
    }),
    {
      name: 'routine-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
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
        if (version < 5) {
          // v5: soft delete — no migration needed, deletedAt is optional
        }
        return state as RoutineStore;
      },
    },
  ),
);
