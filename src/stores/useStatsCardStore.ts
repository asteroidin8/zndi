import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type StatsCardId = 'fasting' | 'routine' | 'todo' | 'weight';

export type StatsCardEntry = {
  id: StatsCardId;
  visible: boolean;
};

const DEFAULT_CARDS: StatsCardEntry[] = [
  { id: 'fasting', visible: true },
  { id: 'routine', visible: true },
  { id: 'todo', visible: true },
  { id: 'weight', visible: true },
];

type StatsCardStore = {
  cards: StatsCardEntry[];
  setCards: (cards: StatsCardEntry[]) => void;
  toggleCard: (id: StatsCardId) => void;
  resetCards: () => void;
};

export const useStatsCardStore = create<StatsCardStore>()(
  persist(
    (set) => ({
      cards: DEFAULT_CARDS,
      setCards: (cards) => set({ cards }),
      toggleCard: (id) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
        })),
      resetCards: () => set({ cards: DEFAULT_CARDS }),
    }),
    {
      name: 'stats-card-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: () => ({ cards: DEFAULT_CARDS }),
    },
  ),
);
