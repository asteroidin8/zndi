import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserProfile, WeightRecord } from '@/types';

export type { UserProfile } from '@/types';

type UserStore = {
  profile: UserProfile;
  weightRecords: WeightRecord[];
  updateProfile: (updates: Partial<UserProfile>) => void;
  addWeightRecord: (record: WeightRecord) => void;
  removeWeightRecord: (id: string) => void;
  /** @deprecated 개별 setter 대신 updateProfile 사용 */
  setHeight: (cm: number) => void;
  setWeight: (kg: number) => void;
  setTargetWeight: (kg: number) => void;
  setAge: (years: number) => void;
  setIsMale: (isMale: boolean | null) => void;
  setNickname: (name: string | null) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => {
      const updateProfile = (updates: Partial<UserProfile>) =>
        set((s) => ({ profile: { ...s.profile, ...updates } }));

      return {
        profile: {
          heightCm: null,
          weightKg: null,
          targetWeightKg: null,
          ageYears: null,
          isMale: null,
          nickname: null,
        },
        weightRecords: [],
        updateProfile,
        addWeightRecord: (record) =>
          set((s) => ({
            weightRecords: [...s.weightRecords, record].sort(
              (a, b) => a.date.localeCompare(b.date),
            ),
          })),
        removeWeightRecord: (id) =>
          set((s) => ({
            weightRecords: s.weightRecords.filter((r) => r.id !== id),
          })),
        setHeight: (cm) => updateProfile({ heightCm: cm }),
        setWeight: (kg) => updateProfile({ weightKg: kg }),
        setTargetWeight: (kg) => updateProfile({ targetWeightKg: kg }),
        setAge: (years) => updateProfile({ ageYears: years }),
        setIsMale: (isMale) => updateProfile({ isMale }),
        setNickname: (name) => updateProfile({ nickname: name }),
      };
    },
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 1) {
          state.weightRecords = state.weightRecords ?? [];
        }
        return state as UserStore;
      },
    },
  ),
);
