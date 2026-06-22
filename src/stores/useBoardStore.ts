import { create } from 'zustand';

import type { Board, BoardDailyProgress, BoardMember } from '@/types';

type BoardStore = {
  boards: Board[];
  members: Record<string, BoardMember[]>;
  progress: Record<string, BoardDailyProgress[]>;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setMembers: (boardId: string, members: BoardMember[]) => void;
  addMember: (member: BoardMember) => void;
  removeMember: (boardId: string, userId: string) => void;
  setProgress: (boardId: string, progress: BoardDailyProgress[]) => void;
  upsertProgress: (entry: BoardDailyProgress) => void;
  reset: () => void;
};

export const useBoardStore = create<BoardStore>()((set) => ({
  boards: [],
  members: {},
  progress: {},
  setBoards: (boards) => set({ boards }),
  addBoard: (board) => set((s) => ({ boards: [...s.boards, board] })),
  removeBoard: (boardId) =>
    set((s) => ({
      boards: s.boards.filter((b) => b.id !== boardId),
      members: Object.fromEntries(Object.entries(s.members).filter(([k]) => k !== boardId)),
      progress: Object.fromEntries(Object.entries(s.progress).filter(([k]) => k !== boardId)),
    })),
  setMembers: (boardId, members) =>
    set((s) => ({ members: { ...s.members, [boardId]: members } })),
  addMember: (member) =>
    set((s) => ({
      members: {
        ...s.members,
        [member.boardId]: [...(s.members[member.boardId] ?? []), member],
      },
    })),
  removeMember: (boardId, userId) =>
    set((s) => ({
      members: {
        ...s.members,
        [boardId]: (s.members[boardId] ?? []).filter((m) => m.userId !== userId),
      },
    })),
  setProgress: (boardId, progress) =>
    set((s) => ({ progress: { ...s.progress, [boardId]: progress } })),
  upsertProgress: (entry) =>
    set((s) => {
      const existing = s.progress[entry.boardId] ?? [];
      const idx = existing.findIndex(
        (p) => p.userId === entry.userId && p.date === entry.date,
      );
      const next = [...existing];
      if (idx >= 0) next[idx] = entry;
      else next.push(entry);
      return { progress: { ...s.progress, [entry.boardId]: next } };
    }),
  reset: () => set({ boards: [], members: {}, progress: {} }),
}));
