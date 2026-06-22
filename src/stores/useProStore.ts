import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GrassColorId, GrassCellShape, GrassAnimationId } from '@/constants/grassTheme';

export type ProStore = {
  isPro: boolean;
  purchasedColors: GrassColorId[];
  purchasedShapes: GrassCellShape[];
  purchasedAnimations: GrassAnimationId[];
  setPro: (value: boolean) => void;
  addPurchasedColor: (id: GrassColorId) => void;
  addPurchasedShape: (id: GrassCellShape) => void;
  addPurchasedAnimation: (id: GrassAnimationId) => void;
  isColorUnlocked: (id: GrassColorId) => boolean;
  isShapeUnlocked: (id: GrassCellShape) => boolean;
  isAnimationUnlocked: (id: GrassAnimationId) => boolean;
};

const FREE_COLORS: GrassColorId[] = ['green'];
const FREE_SHAPES: GrassCellShape[] = ['default'];
const FREE_ANIMATIONS: GrassAnimationId[] = ['none'];

export const useProStore = create<ProStore>()(
  persist(
    (set, get) => ({
      isPro: false,
      purchasedColors: [],
      purchasedShapes: [],
      purchasedAnimations: [],
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
      addPurchasedAnimation: (id) =>
        set((s) => ({
          purchasedAnimations: s.purchasedAnimations.includes(id)
            ? s.purchasedAnimations
            : [...s.purchasedAnimations, id],
        })),
      isColorUnlocked: (id) => {
        const s = get();
        return s.isPro || FREE_COLORS.includes(id) || s.purchasedColors.includes(id);
      },
      isShapeUnlocked: (id) => {
        const s = get();
        return s.isPro || FREE_SHAPES.includes(id) || s.purchasedShapes.includes(id);
      },
      isAnimationUnlocked: (id) => {
        const s = get();
        return s.isPro || FREE_ANIMATIONS.includes(id) || s.purchasedAnimations.includes(id);
      },
    }),
    {
      name: 'pro-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
