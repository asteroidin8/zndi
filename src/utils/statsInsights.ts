import type { FastingRecord, Routine, Todo } from '@/types';

import { localDateStr } from './dateFormat';
import { isRoutineScheduledForDate } from './routineSchedule';

export type Insight = {
  type: string;
  icon: string;
  message: string;
  score: number;
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const ONE_WEEK_MS = 7 * 86_400_000;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function weekCompletionRate(
  days: Date[],
  routines: Routine[],
  completions: Record<string, number>,
): number {
  let scheduled = 0;
  let completed = 0;
  for (const date of days) {
    const dateStr = localDateStr(date);
    for (const r of routines) {
      if (isRoutineScheduledForDate(r, date)) {
        scheduled++;
        if (completions[`${dateStr}:${r.id}`]) completed++;
      }
    }
  }
  return scheduled > 0 ? completed / scheduled : -1;
}

function completionRateInsight(
  routines: Routine[],
  completions: Record<string, number>,
): Insight | null {
  if (routines.length === 0) return null;

  const thisWeek: Date[] = [];
  const lastWeek: Date[] = [];
  for (let i = 0; i < 7; i++) {
    thisWeek.push(daysAgo(i));
    lastWeek.push(daysAgo(i + 7));
  }

  const thisRate = weekCompletionRate(thisWeek, routines, completions);
  const lastRate = weekCompletionRate(lastWeek, routines, completions);
  if (thisRate < 0 || lastRate < 0) return null;

  const diff = Math.round((thisRate - lastRate) * 100);
  if (diff === 0) return null;

  const abs = Math.abs(diff);
  if (diff > 0) {
    return {
      type: 'completion_rate_up',
      icon: 'TrendingUp',
      message: `루틴 완료율이 지난주 대비 ${abs}% 올랐어요`,
      score: Math.min(abs * 2, 100),
    };
  }
  return {
    type: 'completion_rate_down',
    icon: 'TrendingDown',
    message: `루틴 완료율이 지난주 대비 ${abs}% 내려갔어요`,
    score: Math.min(abs, 50),
  };
}

function streakInsight(
  routines: Routine[],
  completions: Record<string, number>,
): Insight | null {
  if (routines.length === 0) return null;

  let bestStreak = 0;
  let bestName = '';

  for (const routine of routines) {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      if (isRoutineScheduledForDate(routine, cursor)) {
        const key = `${localDateStr(cursor)}:${routine.id}`;
        if (completions[key]) {
          streak++;
        } else if (i === 0) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        } else {
          break;
        }
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    if (streak > bestStreak) {
      bestStreak = streak;
      bestName = routine.name;
    }
  }

  if (bestStreak < 3) return null;

  return {
    type: 'streak',
    icon: 'Flame',
    message: `${bestName} ${bestStreak}일 연속 달성 중이에요`,
    score: Math.min(bestStreak * 3, 100),
  };
}

function dayOfWeekInsight(
  routines: Routine[],
  completions: Record<string, number>,
): Insight | null {
  if (routines.length === 0) return null;

  const stats = Array.from({ length: 7 }, () => ({ scheduled: 0, completed: 0 }));

  for (let i = 0; i < 28; i++) {
    const date = daysAgo(i);
    const dateStr = localDateStr(date);
    const day = date.getDay();
    for (const r of routines) {
      if (isRoutineScheduledForDate(r, date)) {
        stats[day].scheduled++;
        if (completions[`${dateStr}:${r.id}`]) stats[day].completed++;
      }
    }
  }

  let worstDay = -1;
  let worstRate = 1;

  for (let d = 0; d < 7; d++) {
    if (stats[d].scheduled < 2) continue;
    const rate = stats[d].completed / stats[d].scheduled;
    if (rate < worstRate) {
      worstRate = rate;
      worstDay = d;
    }
  }

  if (worstDay === -1) return null;

  const pct = Math.round(worstRate * 100);
  if (pct >= 70) return null;

  return {
    type: 'weak_day',
    icon: 'CalendarX2',
    message: `${DAY_NAMES[worstDay]}요일 달성률이 가장 낮아요 (${pct}%)`,
    score: Math.min((70 - pct) * 2, 80),
  };
}

function todoSpeedInsight(todos: Todo[]): Insight | null {
  const now = Date.now();

  const thisWeek = todos.filter(
    (t) => t.completedAt && t.completedAt > now - ONE_WEEK_MS,
  );
  const lastWeek = todos.filter(
    (t) =>
      t.completedAt &&
      t.completedAt > now - 2 * ONE_WEEK_MS &&
      t.completedAt <= now - ONE_WEEK_MS,
  );

  if (thisWeek.length < 2 && lastWeek.length < 2) return null;

  if (lastWeek.length > 0 && thisWeek.length > lastWeek.length) {
    return {
      type: 'todo_speed_up',
      icon: 'Zap',
      message: '이번 주 할일 처리 속도가 빨라졌어요',
      score: Math.min((thisWeek.length - lastWeek.length) * 10, 70),
    };
  }

  if (thisWeek.length >= 3 && lastWeek.length === 0) {
    return {
      type: 'todo_active',
      icon: 'Zap',
      message: `이번 주 할일 ${thisWeek.length}개를 완료했어요`,
      score: 30,
    };
  }

  return null;
}

function fastingTrendInsight(records: FastingRecord[]): Insight | null {
  if (records.length < 3) return null;

  const now = Date.now();
  const thisWeek = records.filter(
    (r) => r.endedAt && r.endedAt > now - ONE_WEEK_MS && r.result === 'completed',
  );
  const lastWeek = records.filter(
    (r) =>
      r.endedAt &&
      r.endedAt > now - 2 * ONE_WEEK_MS &&
      r.endedAt <= now - ONE_WEEK_MS &&
      r.result === 'completed',
  );

  if (thisWeek.length === 0 || lastWeek.length === 0) return null;

  function avgHours(recs: FastingRecord[]): number {
    const total = recs.reduce(
      (sum, r) => sum + (r.endedAt! - r.startedAt) / 3_600_000,
      0,
    );
    return total / recs.length;
  }

  const thisAvg = avgHours(thisWeek);
  const lastAvg = avgHours(lastWeek);
  const diff = thisAvg - lastAvg;

  if (Math.abs(diff) < 0.5) return null;

  const from = Math.round(lastAvg);
  const to = Math.round(thisAvg);

  if (diff > 0) {
    return {
      type: 'fasting_up',
      icon: 'Timer',
      message: `평균 단식 시간이 ${from}h → ${to}h로 늘었어요`,
      score: Math.min(Math.round(diff * 10), 80),
    };
  }

  return {
    type: 'fasting_down',
    icon: 'Timer',
    message: `평균 단식 시간이 ${from}h → ${to}h로 줄었어요`,
    score: Math.min(Math.round(Math.abs(diff) * 5), 40),
  };
}

export function generateInsights(params: {
  routines: Routine[];
  completions: Record<string, number>;
  todos: Todo[];
  fastingRecords: FastingRecord[];
}): Insight[] {
  const generators = [
    () => completionRateInsight(params.routines, params.completions),
    () => streakInsight(params.routines, params.completions),
    () => dayOfWeekInsight(params.routines, params.completions),
    () => todoSpeedInsight(params.todos),
    () => fastingTrendInsight(params.fastingRecords),
  ];

  const results: Insight[] = [];
  for (const gen of generators) {
    const insight = gen();
    if (insight) results.push(insight);
  }

  return results.sort((a, b) => b.score - a.score);
}
