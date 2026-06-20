import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserProfile } from '@/types';

export type { UserProfile } from '@/types';

type UserStore = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
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
        updateProfile,
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
    },
  ),
);
