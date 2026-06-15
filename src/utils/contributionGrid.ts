import type { Routine } from '@/stores/useRoutineStore';

import { getRoutineProgressForDate, toDateStr } from './homeDailyBoard';

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
