import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Weekday } from '@/types';
import { toDateStr } from '@/utils/homeDailyBoard';

const MAX_STREAK_DAYS = 365;
const COMPLETION_RETENTION_DAYS = 30;

function makeKey(routineId: string, date: string) {
  return `${date}:${routineId}`;
}

type RoutineCompletionStore = {
  completions: Record<string, number>;
  toggleCompletion: (routineId: string, date: string) => void;
  isCompleted: (routineId: string, date: string) => boolean;
  getCompletedIds: (date: string) => string[];
  getStreak: (routineId: string, repeatDays: Weekday[]) => number;
  clearOldCompletions: () => void;
};

export const useRoutineCompletionStore = create<RoutineCompletionStore>()(
  persist(
    (set, get) => ({
      completions: {},

      toggleCompletion: (routineId, date) => {
        const key = makeKey(routineId, date);
        set((s) => {
          const next = { ...s.completions };
          if (next[key]) {
            delete next[key];
          } else {
            next[key] = Date.now();
          }
          return { completions: next };
        });
      },

      isCompleted: (routineId, date) => {
        return !!get().completions[makeKey(routineId, date)];
      },

      getCompletedIds: (date) => {
        const prefix = `${date}:`;
        return Object.keys(get().completions)
          .filter((k) => k.startsWith(prefix))
          .map((k) => k.slice(prefix.length));
      },

      getStreak: (routineId, repeatDays) => {
        const { completions } = get();
        let streak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        for (let i = 0; i < MAX_STREAK_DAYS; i++) {
          const dayOfWeek = cursor.getDay();
          if (repeatDays.includes(dayOfWeek as Weekday)) {
            const dateStr = toDateStr(cursor);
            if (completions[makeKey(routineId, dateStr)]) {
              streak++;
            } else if (i === 0) {
              cursor.setDate(cursor.getDate() - 1);
              continue;
            } else {
              break;
            }
          }
          cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
      },

      clearOldCompletions: () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - COMPLETION_RETENTION_DAYS);
        const cutoffStr = toDateStr(cutoff);
        set((s) => {
          const next: Record<string, number> = {};
          for (const [key, ts] of Object.entries(s.completions)) {
            if (key.slice(0, 10) >= cutoffStr) {
              next[key] = ts;
            }
          }
          return { completions: next };
        });
      },
    }),
    {
      name: 'routine-completion-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
