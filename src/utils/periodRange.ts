export type Period = 'weekly' | 'monthly';

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getPeriodRange(period: Period, offset: number) {
  const now = new Date();
  if (period === 'weekly') {
    const monday = getMonday(now);
    monday.setDate(monday.getDate() + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const label = `${monday.getMonth() + 1}/${monday.getDate()} ~ ${sunday.getMonth() + 1}/${sunday.getDate()}`;
    const end = new Date(monday);
    end.setDate(end.getDate() + 7);
    return { start: monday, end, label };
  }
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const label = `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  return { start, end, label };
}

export function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(start);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  while (d < end && d <= now) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
