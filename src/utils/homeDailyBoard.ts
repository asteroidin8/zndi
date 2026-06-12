import type { Routine } from '@/stores/useRoutineStore';
import type { Todo } from '@/stores/useTodoStore';

export type DayDotStatus = 'none' | 'empty' | 'partial' | 'full';

export type WeekDayDot = {
  dateStr: string;
  weekdayLabel: string;
  status: DayDotStatus;
  routineCompleted: number;
  routineTotal: number;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getRoutineProgressForDate(
  dateStr: string,
  dayOfWeek: number,
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
) {
  const dayRoutines = routines.filter((r) => r.repeatDays.includes(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6));
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
      weekdayLabel: WEEKDAYS[dayOfWeek],
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

export function getTodosCompletedTodayCount(todos: Todo[]) {
  const today = toDateStr(new Date());
  return todos.filter((t) => {
    if (!t.completedAt) return false;
    return toDateStr(new Date(t.completedAt)) === today;
  }).length;
}

export function getTodaySummaryMessage({
  routineCompleted,
  routineTotal,
  activeTodos,
  todosCompletedToday,
}: {
  routineCompleted: number;
  routineTotal: number;
  activeTodos: number;
  todosCompletedToday: number;
}) {
  const routineDone = routineTotal > 0 && routineCompleted >= routineTotal;
  const hasTodoActivity = activeTodos === 0 || todosCompletedToday > 0;

  if (routineTotal === 0 && activeTodos === 0) {
    return '오늘은 가볍게 쉬어가도 좋아요';
  }
  if (routineDone && activeTodos === 0) {
    return '오늘 할 일을 모두 챙겼어요';
  }
  if (routineDone) {
    return '루틴 완료! 할 일도 하나씩 이어가요';
  }
  if (routineTotal > 0 && routineCompleted === 0 && todosCompletedToday === 0) {
    return '하나씩 시작해 볼까요?';
  }
  if (hasTodoActivity && routineCompleted > 0) {
    return '좋아요, 오늘도 잘 챙기고 있어요';
  }
  return '조금만 더 이어가면 오늘 목표에 가까워져요';
}
