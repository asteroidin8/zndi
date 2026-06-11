import { create } from 'zustand';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = 일요일

export type Routine = {
  id: string;
  name: string;
  repeatDays: Weekday[];
  reminderTime: string | null; // 'HH:mm' 형식, null이면 알림 없음
  createdAt: number;
  order: number;
};

type RoutineStore = {
  routines: Routine[];
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;
  reorderRoutines: (ordered: Routine[]) => void;
};

export const useRoutineStore = create<RoutineStore>((set) => ({
  routines: [],
  addRoutine: (routine) =>
    set((state) => ({ routines: [...state.routines, routine] })),
  updateRoutine: (id, updates) =>
    set((state) => ({
      routines: state.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  removeRoutine: (id) =>
    set((state) => ({ routines: state.routines.filter((r) => r.id !== id) })),
  reorderRoutines: (ordered) =>
    set({ routines: ordered.map((r, i) => ({ ...r, order: i })) }),
}));
