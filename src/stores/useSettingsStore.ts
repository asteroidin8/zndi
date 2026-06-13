import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type HintKey = 'swipeActions' | 'longPressEdit';

type SettingsStore = {
  foregroundServiceEnabled: boolean;
  themeMode: ThemeMode;
  routineNotificationsEnabled: boolean;
  todoNotificationsEnabled: boolean;
  onboardingCompleted: boolean;
  seenHints: Partial<Record<HintKey, boolean>>;
  toggleForegroundService: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setRoutineNotifications: (enabled: boolean) => void;
  setTodoNotifications: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  markHintSeen: (key: HintKey) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      foregroundServiceEnabled: true,
      themeMode: 'system',
      routineNotificationsEnabled: false,
      todoNotificationsEnabled: false,
      onboardingCompleted: false,
      seenHints: {},
      toggleForegroundService: () =>
        set((s) => ({ foregroundServiceEnabled: !s.foregroundServiceEnabled })),
      setThemeMode: (mode) => set({ themeMode: mode }),
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
