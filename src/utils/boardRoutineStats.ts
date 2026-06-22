import type { BoardRoutine, BoardVerificationLog } from '@/types';

import { localDateStr } from './dateFormat';

export type BoardRoutineData = {
  total: number;
  getCompleted: (dateStr: string) => number;
};

export function countBoardRoutinesTotal(
  boardRoutines: Record<string, BoardRoutine[]>,
): number {
  let total = 0;
  for (const routines of Object.values(boardRoutines)) {
    total += routines.length;
  }
  return total;
}

export function countBoardCompletionsForDate(
  boardLogs: Record<string, BoardVerificationLog[]>,
  userId: string,
  dateStr: string,
): number {
  const verifiedIds = new Set<string>();
  for (const logs of Object.values(boardLogs)) {
    for (const log of logs) {
      if (log.userId !== userId) continue;
      if (localDateStr(new Date(log.createdAt)) !== dateStr) continue;
      verifiedIds.add(log.routineId);
    }
  }
  return verifiedIds.size;
}

export function buildBoardCompletionLookup(
  boardLogs: Record<string, BoardVerificationLog[]>,
  userId: string,
): (dateStr: string) => number {
  const map = new Map<string, Set<string>>();
  for (const logs of Object.values(boardLogs)) {
    for (const log of logs) {
      if (log.userId !== userId) continue;
      const ds = localDateStr(new Date(log.createdAt));
      let set = map.get(ds);
      if (!set) {
        set = new Set();
        map.set(ds, set);
      }
      set.add(log.routineId);
    }
  }
  return (dateStr: string) => map.get(dateStr)?.size ?? 0;
}

export function buildBoardRoutineData(
  boardRoutines: Record<string, BoardRoutine[]>,
  boardLogs: Record<string, BoardVerificationLog[]>,
  userId: string,
): BoardRoutineData | undefined {
  const total = countBoardRoutinesTotal(boardRoutines);
  if (total === 0) return undefined;
  return { total, getCompleted: buildBoardCompletionLookup(boardLogs, userId) };
}
