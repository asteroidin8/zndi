import type { Routine, Weekday } from '@/types';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function isRoutineScheduledForDate(routine: Routine, date: Date): boolean {
  const type = routine.repeatType ?? 'weekly';
  if (type === 'daily') return true;
  if (type === 'monthly') return (routine.monthDates ?? []).includes(date.getDate());
  return routine.repeatDays.includes(date.getDay() as Weekday);
}

export function formatRepeatLabel(routine: Routine): string {
  const type = routine.repeatType ?? 'weekly';
  if (type === 'daily') return '매일';
  if (type === 'monthly') {
    const dates = routine.monthDates ?? [];
    if (dates.length === 0) return '매월';
    if (dates.length <= 4) return `매월 ${dates.join(', ')}일`;
    return `매월 ${dates.slice(0, 3).join(', ')}일 외 ${dates.length - 3}개`;
  }
  return routine.repeatDays.map((d) => DAY_LABELS[d]).join('·');
}
