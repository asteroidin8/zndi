import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FastingRecord, FastingResult, FastingStatus } from '@/types';

export type { FastingRecord, FastingResult, FastingStatus } from '@/types';

type FastingStore = {
  status: FastingStatus;
  startedAt: number | null;
  goalHours: number;
  records: FastingRecord[];
  startFasting: () => void;
  stopFasting: (result: FastingResult) => void;
  setGoalHours: (hours: number) => void;
  updateStartTime: (timestamp: number) => void;
  removeRecord: (id: string) => void;
  updateRecord: (id: string, updates: Partial<FastingRecord>) => void;
};

export const useFastingStore = create<FastingStore>()(
  persist(
    (set, get) => ({
      status: 'idle',
      startedAt: null,
      goalHours: 16,
      records: [],
      startFasting: () => set({ status: 'fasting', startedAt: Date.now() }),
      stopFasting: (result) => {
        const { startedAt, goalHours, records } = get();
        if (!startedAt) return;
        const newRecord: FastingRecord = {
          id: String(Date.now()),
          startedAt,
          endedAt: Date.now(),
          goalHours,
          result,
        };
        set({ status: 'idle', startedAt: null, records: [...records, newRecord] });
      },
      setGoalHours: (hours) => set({ goalHours: hours }),
      updateStartTime: (timestamp) => {
        if (get().status === 'fasting') set({ startedAt: timestamp });
      },
      removeRecord: (id) =>
        set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      updateRecord: (id, updates) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
    }),
    {
      name: 'fasting-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
