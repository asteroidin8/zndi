import { create } from 'zustand';

type SettingsStore = {
  foregroundServiceEnabled: boolean;
  toggleForegroundService: () => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  foregroundServiceEnabled: true,
  toggleForegroundService: () =>
    set((s) => ({ foregroundServiceEnabled: !s.foregroundServiceEnabled })),
}));
