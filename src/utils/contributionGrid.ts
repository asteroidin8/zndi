import type { Routine } from '@/stores/useRoutineStore';

import type { BoardRoutineData } from './boardRoutineStats';
import { getRoutineProgressForDate, toDateStr } from './homeDailyBoard';

export function getMonthRoutineStats(
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
  refDate = new Date(),
  boardData?: BoardRoutineData,
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
    const boardCompleted = boardData?.getCompleted(dateStr) ?? 0;
    const totalCompleted = completed + boardCompleted;
    const totalCount = total + (boardData?.total ?? 0);
    if (totalCount > 0) {
      daysWithRoutines++;
      if (totalCompleted >= totalCount) daysFullyComplete++;
    }
  }

  return {
    daysWithRoutines,
    daysFullyComplete,
    rate: daysWithRoutines > 0 ? daysFullyComplete / daysWithRoutines : 0,
  };
}
