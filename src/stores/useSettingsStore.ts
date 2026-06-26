import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { HintKey, ThemeMode } from '@/types';
import type { GrassColorId, GrassCellShape } from '@/constants/grassTheme';

export type { HintKey, ThemeMode } from '@/types';

export type TimeFormat = '12h' | '24h';

type SettingsStore = {
  foregroundServiceEnabled: boolean;
  themeMode: ThemeMode;
  timeFormat: TimeFormat;
  grassColor: GrassColorId;
  grassShape: GrassCellShape;
  routineNotificationsEnabled: boolean;
  todoNotificationsEnabled: boolean;
  onboardingCompleted: boolean;
  seenHints: Partial<Record<HintKey, boolean>>;
  toggleForegroundService: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setGrassColor: (color: GrassColorId) => void;
  setGrassShape: (shape: GrassCellShape) => void;
  setRoutineNotifications: (enabled: boolean) => void;
  setTodoNotifications: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  markHintSeen: (key: HintKey) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      foregroundServiceEnabled: true,
      themeMode: 'dark',
      timeFormat: '24h',
      grassColor: 'green',
      grassShape: 'default',
      routineNotificationsEnabled: false,
      todoNotificationsEnabled: false,
      onboardingCompleted: false,
      seenHints: {},
      toggleForegroundService: () =>
        set((s) => ({ foregroundServiceEnabled: !s.foregroundServiceEnabled })),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setTimeFormat: (format) => set({ timeFormat: format }),
      setGrassColor: (color) => set({ grassColor: color }),
      setGrassShape: (shape) => set({ grassShape: shape }),
      setRoutineNotifications: (enabled) => set({ routineNotificationsEnabled: enabled }),
      setTodoNotifications: (enabled) => set({ todoNotificationsEnabled: enabled }),
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      markHintSeen: (key) =>
        set((s) => ({ seenHints: { ...s.seenHints, [key]: true } })),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
