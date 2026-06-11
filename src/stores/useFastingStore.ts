import { create } from 'zustand';

export type FastingStatus = 'idle' | 'fasting';
export type FastingResult = 'completed' | 'abandoned';

export type FastingRecord = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  goalHours: number;
  result: FastingResult | null;
};

type FastingStore = {
  status: FastingStatus;
  startedAt: number | null;
  goalHours: number;
  records: FastingRecord[];
  startFasting: () => void;
  stopFasting: (result: FastingResult) => void;
  setGoalHours: (hours: number) => void;
  removeRecord: (id: string) => void;
  updateRecord: (id: string, updates: Partial<FastingRecord>) => void;
};

export const useFastingStore = create<FastingStore>((set, get) => ({
  status: 'idle',
  startedAt: null,
  goalHours: 16,
  records: [],
  startFasting: () =>
    set({ status: 'fasting', startedAt: Date.now() }),
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
  removeRecord: (id) =>
    set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
  updateRecord: (id, updates) =>
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
}));
