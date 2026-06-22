import type { ThemeColors } from '@/constants/colors';
import { getGrassColor, getGrassNeonGlow } from '@/constants/grassTheme';
import type { Routine } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { Todo } from '@/stores/useTodoStore';

import type { BoardRoutineData } from './boardRoutineStats';
import { localDateStr } from './dateFormat';
import { getRoutineProgressForDate, toDateStr } from './homeDailyBoard';

export type GrassLevel = 0 | 1 | 2 | 3 | 4;

export type DailyGrassActivity = {
  routineCompleted: number;
  routineTotal: number;
  todosCompleted: number;
  score: number;
  level: GrassLevel;
};

export function countTodosCompletedOnDate(todos: Todo[], dateStr: string): number {
  return todos.filter((t) => {
    if (!t.completedAt) return false;
    return localDateStr(new Date(t.completedAt)) === dateStr;
  }).length;
}

/** 완료한 루틴 + 할일 개수 → 0~4 잔디 농도 */
export function scoreToGrassLevel(score: number): GrassLevel {
  if (score <= 0) return 0;
  if (score === 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

export function getDailyGrassActivity(
  dateStr: string,
  dayOfWeek: number,
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
  todos: Todo[],
  boardData?: BoardRoutineData,
): DailyGrassActivity {
  const { completed: personalCompleted, total: personalTotal } = getRoutineProgressForDate(
    dateStr,
    dayOfWeek,
    routines,
    isCompleted,
  );
  const boardCompleted = boardData?.getCompleted(dateStr) ?? 0;
  const routineCompleted = personalCompleted + boardCompleted;
  const routineTotal = personalTotal + (boardData?.total ?? 0);
  const todosCompleted = countTodosCompletedOnDate(todos, dateStr);
  const score = routineCompleted + todosCompleted;

  return {
    routineCompleted,
    routineTotal,
    todosCompleted,
    score,
    level: scoreToGrassLevel(score),
  };
}

export function buildMonthGrassMap(
  year: number,
  month: number,
  routines: Routine[],
  isCompleted: (routineId: string, date: string) => boolean,
  todos: Todo[],
  boardData?: BoardRoutineData,
): Map<string, DailyGrassActivity> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map = new Map<string, DailyGrassActivity>();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = toDateStr(date);
    map.set(
      dateStr,
      getDailyGrassActivity(dateStr, date.getDay(), routines, isCompleted, todos, boardData),
    );
  }

  return map;
}

export function grassCellColors(
  level: GrassLevel,
  c: ThemeColors,
  isToday: boolean,
  hasFasting: boolean,
  colorOverride?: string,
) {
  const grassHex = colorOverride ?? getGrassColor(useSettingsStore.getState().grassColor);

  if (level === 0) {
    return {
      fill: hasFasting ? c.surfaceSubtle : 'transparent',
      fillOpacity: 1,
      borderColor: isToday ? c.accent : hasFasting ? c.borderStrong : c.border,
      glow: false,
      neonGlow: getGrassNeonGlow(grassHex),
    };
  }

  const fillOpacity = level === 1 ? 0.2 : level === 2 ? 0.4 : level === 3 ? 0.65 : 1;

  return {
    fill: grassHex,
    fillOpacity,
    borderColor: isToday ? c.accent : level >= 3 ? grassHex : c.borderStrong,
    glow: level >= 3,
    neonGlow: getGrassNeonGlow(grassHex),
  };
}
