import { create } from 'zustand';

import type { FollowUser, UserDailyProgress } from '@/types';

export const EMPTY_FRIEND_PROGRESS: UserDailyProgress[] = [];

type FollowStore = {
  following: FollowUser[];
  followers: FollowUser[];
  friendProgress: Record<string, UserDailyProgress[]>;
  setFollowing: (users: FollowUser[]) => void;
  setFollowers: (users: FollowUser[]) => void;
  addFollowing: (user: FollowUser) => void;
  removeFollowing: (userId: string) => void;
  setFriendProgress: (userId: string, progress: UserDailyProgress[]) => void;
  reset: () => void;
};

export const useFollowStore = create<FollowStore>()((set) => ({
  following: [],
  followers: [],
  friendProgress: {},
  setFollowing: (following) => set({ following }),
  setFollowers: (followers) => set({ followers }),
  addFollowing: (user) =>
    set((s) => ({ following: [...s.following, user] })),
  removeFollowing: (userId) =>
    set((s) => ({
      following: s.following.filter((u) => u.userId !== userId),
      friendProgress: Object.fromEntries(
        Object.entries(s.friendProgress).filter(([k]) => k !== userId),
      ),
    })),
  setFriendProgress: (userId, progress) =>
    set((s) => ({ friendProgress: { ...s.friendProgress, [userId]: progress } })),
  reset: () => set({ following: [], followers: [], friendProgress: {} }),
}));
