import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsStore = {
  foregroundServiceEnabled: boolean;
  themeMode: ThemeMode;
  toggleForegroundService: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      foregroundServiceEnabled: true,
      themeMode: 'system',
      toggleForegroundService: () =>
        set((s) => ({ foregroundServiceEnabled: !s.foregroundServiceEnabled })),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
