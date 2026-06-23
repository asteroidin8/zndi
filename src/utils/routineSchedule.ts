import { DAY_LABELS } from '@/constants/statsLabels';
import type { Routine, Weekday } from '@/types';

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcB - utcA) / msPerDay);
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function isRoutineScheduledForDate(routine: Routine, date: Date): boolean {
  const type = routine.repeatType ?? 'weekly';
  const interval = routine.repeatInterval ?? 1;
  const created = new Date(routine.createdAt);

  if (type === 'daily') {
    if (interval <= 1) return true;
    const diff = daysBetween(created, date);
    return diff >= 0 && diff % interval === 0;
  }

  if (type === 'weekly') {
    if (!routine.repeatDays.includes(date.getDay() as Weekday)) return false;
    if (interval <= 1) return true;
    const diffDays = daysBetween(created, date);
    const diffWeeks = Math.floor(diffDays / 7);
    return diffDays >= 0 && diffWeeks % interval === 0;
  }

  if (type === 'monthly') {
    if (!(routine.monthDates ?? []).includes(date.getDate())) return false;
    if (interval <= 1) return true;
    const diff = monthsBetween(created, date);
    return diff >= 0 && diff % interval === 0;
  }

  if (type === 'yearly') {
    const createdMonth = created.getMonth();
    const createdDate = created.getDate();
    if (date.getMonth() !== createdMonth || date.getDate() !== createdDate) return false;
    if (interval <= 1) return true;
    const diffYears = date.getFullYear() - created.getFullYear();
    return diffYears >= 0 && diffYears % interval === 0;
  }

  return routine.repeatDays.includes(date.getDay() as Weekday);
}

export function formatRepeatLabel(routine: Routine): string {
  const type = routine.repeatType ?? 'weekly';
  const interval = routine.repeatInterval ?? 1;

  if (type === 'daily') {
    return interval > 1 ? `${interval}일마다` : '매일';
  }
  if (type === 'monthly') {
    const dates = routine.monthDates ?? [];
    const prefix = interval > 1 ? `${interval}개월마다` : '매월';
    if (dates.length === 0) return prefix;
    if (dates.length <= 4) return `${prefix} ${dates.join(', ')}일`;
    return `${prefix} ${dates.slice(0, 3).join(', ')}일 외 ${dates.length - 3}개`;
  }
  if (type === 'yearly') {
    return interval > 1 ? `${interval}년마다` : '매년';
  }

  // weekly
  const dayLabel = routine.repeatDays.map((d) => DAY_LABELS[d]).join('·');
  return interval > 1 ? `${interval}주마다 ${dayLabel}` : dayLabel;
}
