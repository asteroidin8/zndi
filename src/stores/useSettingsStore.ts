import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsStore = {
  foregroundServiceEnabled: boolean;
  themeMode: ThemeMode;
  routineNotificationsEnabled: boolean;
  todoNotificationsEnabled: boolean;
  toggleForegroundService: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setRoutineNotifications: (enabled: boolean) => void;
  setTodoNotifications: (enabled: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      foregroundServiceEnabled: true,
      themeMode: 'system',
      routineNotificationsEnabled: false,
      todoNotificationsEnabled: false,
      toggleForegroundService: () =>
        set((s) => ({ foregroundServiceEnabled: !s.foregroundServiceEnabled })),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setRoutineNotifications: (enabled) => set({ routineNotificationsEnabled: enabled }),
      setTodoNotifications: (enabled) => set({ todoNotificationsEnabled: enabled }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
