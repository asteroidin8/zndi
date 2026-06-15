import type { Routine } from '@/stores/useRoutineStore';

import { getRoutineProgressForDate, toDateStr } from './homeDailyBoard';

export type ContributionCell = {
  dateStr: string | null;
  completed: number;
  total: number;
  rate: number;
  isToday: boolean;
  isFull: boolean;
};

const GRID_DAYS = 42;

/** GitHub 스타일 7열 그리드 (일요일 시작, 최근 42일 + 패딩) */
export function buildContributionGrid(
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
  totalDays = GRID_DAYS,
): ContributionCell[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = toDateStr(today);

  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));

  const emptyCell = (): ContributionCell => ({
    dateStr: null,
    completed: 0,
    total: 0,
    rate: 0,
    isToday: false,
    isFull: false,
  });

  const cells: ContributionCell[] = [];

  for (let i = 0; i < start.getDay(); i++) {
    cells.push(emptyCell());
  }

  const cursor = new Date(start);
  while (cursor <= today) {
    const dateStr = toDateStr(cursor);
    const { completed, total } = getRoutineProgressForDate(
      dateStr,
      cursor.getDay(),
      routines,
      isCompleted,
    );
    cells.push({
      dateStr,
      completed,
      total,
      rate: total > 0 ? completed / total : 0,
      isToday: dateStr === todayStr,
      isFull: total > 0 && completed >= total,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  while (cells.length % 7 !== 0) {
    cells.push(emptyCell());
  }

  return cells;
}

export function getMonthRoutineStats(
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
  refDate = new Date(),
) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let daysWithRoutines = 0;
  let daysFullyComplete = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = toDateStr(date);
    const { completed, total } = getRoutineProgressForDate(
      dateStr,
      date.getDay(),
      routines,
      isCompleted,
    );
    if (total > 0) {
      daysWithRoutines++;
      if (completed >= total) daysFullyComplete++;
    }
  }

  return {
    daysWithRoutines,
    daysFullyComplete,
    rate: daysWithRoutines > 0 ? daysFullyComplete / daysWithRoutines : 0,
  };
}

export function countFullDaysInGrid(cells: ContributionCell[]) {
  return cells.filter((c) => c.dateStr && c.isFull).length;
}

export function hasMinimalContribution(cells: ContributionCell[]) {
  return cells.some((c) => c.dateStr && c.total > 0);
}
