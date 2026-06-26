import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GrassColorId, GrassCellShape } from '@/constants/grassTheme';

export type ProStore = {
  isPro: boolean;
  purchasedColors: GrassColorId[];
  purchasedShapes: GrassCellShape[];
  setPro: (value: boolean) => void;
  addPurchasedColor: (id: GrassColorId) => void;
  addPurchasedShape: (id: GrassCellShape) => void;
  isColorUnlocked: (id: GrassColorId) => boolean;
  isShapeUnlocked: (id: GrassCellShape) => boolean;
};

const FREE_COLORS: GrassColorId[] = ['green'];
const FREE_SHAPES: GrassCellShape[] = ['default'];

export const useProStore = create<ProStore>()(
  persist(
    (set, get) => ({
      isPro: false,
      purchasedColors: [],
      purchasedShapes: [],
      setPro: (value) => set({ isPro: value }),
      addPurchasedColor: (id) =>
        set((s) => ({
          purchasedColors: s.purchasedColors.includes(id)
            ? s.purchasedColors
            : [...s.purchasedColors, id],
        })),
      addPurchasedShape: (id) =>
        set((s) => ({
          purchasedShapes: s.purchasedShapes.includes(id)
            ? s.purchasedShapes
            : [...s.purchasedShapes, id],
        })),
      isColorUnlocked: (id) => {
        const s = get();
        return s.isPro || FREE_COLORS.includes(id) || s.purchasedColors.includes(id);
      },
      isShapeUnlocked: (id) => {
        const s = get();
        return s.isPro || FREE_SHAPES.includes(id) || s.purchasedShapes.includes(id);
      },
    }),
    {
      name: 'pro-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
