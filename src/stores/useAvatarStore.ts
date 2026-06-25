import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { AVATARS, type AvatarDef } from '@/constants/avatars';

export type AvatarStore = {
  ownedIds: string[];
  equippedId: string;
  own: (id: string) => void;
  equip: (id: string) => void;
  isOwned: (id: string) => boolean;
};

const DEFAULT_OWNED = AVATARS.filter((a) => a.acquire === 'free').map((a) => a.id);

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      ownedIds: [...DEFAULT_OWNED],
      equippedId: '',
      own: (id) =>
        set((s) => ({
          ownedIds: s.ownedIds.includes(id) ? s.ownedIds : [...s.ownedIds, id],
        })),
      equip: (id) => set({ equippedId: id }),
      isOwned: (id) => {
        const s = get();
        return DEFAULT_OWNED.includes(id) || s.ownedIds.includes(id);
      },
    }),
    {
      name: 'avatar-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
