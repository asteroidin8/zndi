import { create } from 'zustand';

export type FastingStatus = 'idle' | 'fasting';
export type FastingResult = 'completed' | 'abandoned';

type FastingStore = {
  status: FastingStatus;
  startedAt: number | null;
  goalHours: number;
  startFasting: () => void;
  stopFasting: (result: FastingResult) => void;
  setGoalHours: (hours: number) => void;
};

export const useFastingStore = create<FastingStore>((set) => ({
  status: 'idle',
  startedAt: null,
  goalHours: 16,
  startFasting: () => set({ status: 'fasting', startedAt: Date.now() }),
  stopFasting: (_result) => set({ status: 'idle', startedAt: null }),
  setGoalHours: (hours) => set({ goalHours: hours }),
}));
