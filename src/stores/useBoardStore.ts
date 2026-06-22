import { create } from 'zustand';

import type { Board, BoardDailyProgress, BoardMember, BoardRoutine, BoardVerificationLog } from '@/types';

/** Zustand selector에서 ?? [] 사용 시 매 렌더 새 참조 → 무한 리렌더 방지 */
export const EMPTY_BOARD_MEMBERS: BoardMember[] = [];
export const EMPTY_BOARD_PROGRESS: BoardDailyProgress[] = [];
export const EMPTY_BOARD_ROUTINES: BoardRoutine[] = [];
export const EMPTY_BOARD_LOGS: BoardVerificationLog[] = [];

type BoardStore = {
  boards: Board[];
  members: Record<string, BoardMember[]>;
  progress: Record<string, BoardDailyProgress[]>;
  routines: Record<string, BoardRoutine[]>;
  logs: Record<string, BoardVerificationLog[]>;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setMembers: (boardId: string, members: BoardMember[]) => void;
  addMember: (member: BoardMember) => void;
  removeMember: (boardId: string, userId: string) => void;
  setProgress: (boardId: string, progress: BoardDailyProgress[]) => void;
  upsertProgress: (entry: BoardDailyProgress) => void;
  setRoutines: (boardId: string, routines: BoardRoutine[]) => void;
  addRoutine: (routine: BoardRoutine) => void;
  removeRoutine: (boardId: string, routineId: string) => void;
  setLogs: (boardId: string, logs: BoardVerificationLog[]) => void;
  addLog: (log: BoardVerificationLog) => void;
  removeLog: (boardId: string, logId: string) => void;
  reset: () => void;
};

export const useBoardStore = create<BoardStore>()((set) => ({
  boards: [],
  members: {},
  progress: {},
  routines: {},
  logs: {},
  setBoards: (boards) => set({ boards }),
  addBoard: (board) => set((s) => ({ boards: [...s.boards, board] })),
  removeBoard: (boardId) =>
    set((s) => ({
      boards: s.boards.filter((b) => b.id !== boardId),
      members: Object.fromEntries(Object.entries(s.members).filter(([k]) => k !== boardId)),
      progress: Object.fromEntries(Object.entries(s.progress).filter(([k]) => k !== boardId)),
      routines: Object.fromEntries(Object.entries(s.routines).filter(([k]) => k !== boardId)),
      logs: Object.fromEntries(Object.entries(s.logs).filter(([k]) => k !== boardId)),
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
  setRoutines: (boardId, routines) =>
    set((s) => ({ routines: { ...s.routines, [boardId]: routines } })),
  addRoutine: (routine) =>
    set((s) => ({
      routines: {
        ...s.routines,
        [routine.boardId]: [...(s.routines[routine.boardId] ?? []), routine],
      },
    })),
  removeRoutine: (boardId, routineId) =>
    set((s) => ({
      routines: {
        ...s.routines,
        [boardId]: (s.routines[boardId] ?? []).filter((r) => r.id !== routineId),
      },
    })),
  setLogs: (boardId, logs) =>
    set((s) => ({ logs: { ...s.logs, [boardId]: logs } })),
  addLog: (log) =>
    set((s) => ({
      logs: {
        ...s.logs,
        [log.boardId]: [log, ...(s.logs[log.boardId] ?? [])],
      },
    })),
  removeLog: (boardId, logId) =>
    set((s) => ({
      logs: {
        ...s.logs,
        [boardId]: (s.logs[boardId] ?? []).filter((l) => l.id !== logId),
      },
    })),
  reset: () => set({ boards: [], members: {}, progress: {}, routines: {}, logs: {} }),
}));
