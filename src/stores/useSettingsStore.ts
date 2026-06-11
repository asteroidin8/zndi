import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsStore = {
  foregroundServiceEnabled: boolean;
  themeMode: ThemeMode;
  toggleForegroundService: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  foregroundServiceEnabled: true,
  themeMode: 'system',
  toggleForegroundService: () =>
    set((s) => ({ foregroundServiceEnabled: !s.foregroundServiceEnabled })),
  setThemeMode: (mode) => set({ themeMode: mode }),
}));
