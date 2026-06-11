import { create } from 'zustand';

export type UserProfile = {
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  ageYears: number | null;
  isMale: boolean | null;
};

type UserStore = {
  profile: UserProfile;
  setHeight: (cm: number) => void;
  setWeight: (kg: number) => void;
  setTargetWeight: (kg: number) => void;
  setAge: (years: number) => void;
  setIsMale: (isMale: boolean) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  profile: {
    heightCm: null,
    weightKg: null,
    targetWeightKg: null,
    ageYears: null,
    isMale: null,
  },
  setHeight: (cm) => set((s) => ({ profile: { ...s.profile, heightCm: cm } })),
  setWeight: (kg) => set((s) => ({ profile: { ...s.profile, weightKg: kg } })),
  setTargetWeight: (kg) => set((s) => ({ profile: { ...s.profile, targetWeightKg: kg } })),
  setAge: (years) => set((s) => ({ profile: { ...s.profile, ageYears: years } })),
  setIsMale: (isMale) => set((s) => ({ profile: { ...s.profile, isMale } })),
}));
