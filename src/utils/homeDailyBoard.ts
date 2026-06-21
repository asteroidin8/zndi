import { DAY_LABELS } from '@/constants/statsLabels';
import type { Routine } from '@/stores/useRoutineStore';
import type { Todo } from '@/stores/useTodoStore';
import { isRoutineScheduledForDate } from './routineSchedule';

export type DayDotStatus = 'none' | 'empty' | 'partial' | 'full';

export type WeekDayDot = {
  dateStr: string;
  weekdayLabel: string;
  status: DayDotStatus;
  routineCompleted: number;
  routineTotal: number;
};

export function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getRoutineProgressForDate(
  dateStr: string,
  dayOfWeek: number,
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
) {
  const date = new Date(dateStr + 'T12:00:00');
  const dayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, date));
  if (dayRoutines.length === 0) {
    return { completed: 0, total: 0 };
  }
  const completed = dayRoutines.filter((r) => isCompleted(r.id, dateStr)).length;
  return { completed, total: dayRoutines.length };
}

export function getDayDotStatus(completed: number, total: number): DayDotStatus {
  if (total === 0) return 'none';
  if (completed === 0) return 'empty';
  if (completed >= total) return 'full';
  return 'partial';
}

/** 최근 7일(오늘 포함) 루틴 달성 점 */
export function getWeekDayDots(
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
): WeekDayDot[] {
  const dots: WeekDayDot[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() - i);
    const dateStr = toDateStr(date);
    const dayOfWeek = date.getDay();
    const { completed, total } = getRoutineProgressForDate(dateStr, dayOfWeek, routines, isCompleted);

    dots.push({
      dateStr,
      weekdayLabel: DAY_LABELS[dayOfWeek],
      status: getDayDotStatus(completed, total),
      routineCompleted: completed,
      routineTotal: total,
    });
  }

  return dots;
}

/** 루틴이 있는 날 기준 연속 100% 달성 일수 (오늘 미완료는 제외하고 계산) */
export function getRoutineStreakDays(
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateStr(cursor);
    const dayOfWeek = cursor.getDay();
    const { completed, total } = getRoutineProgressForDate(dateStr, dayOfWeek, routines, isCompleted);

    if (total === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (completed >= total) {
      streak++;
    } else if (i === 0) {
      // 오늘은 아직 진행 중일 수 있음
    } else {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getActiveTodoCount(todos: Todo[]) {
  return todos.filter((t) => !t.completedAt).length;
}
