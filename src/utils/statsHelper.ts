import type { FastingResult } from '@/types';
import { localDateStr } from './dateFormat';

export type CompletedFastingRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  goalHours: number;
  result: FastingResult;
};

export type DailyFastingSummary = {
  date: string;
  totalMinutes: number;
  count: number;
  records: CompletedFastingRecord[];
};

export function groupFastingByDay(records: CompletedFastingRecord[]): DailyFastingSummary[] {
  const map: Record<string, DailyFastingSummary> = {};

  for (const r of records) {
    const date = localDateStr(new Date(r.startedAt));
    if (!map[date]) {
      map[date] = { date, totalMinutes: 0, count: 0, records: [] };
    }
    const minutes = Math.floor((r.endedAt - r.startedAt) / 60_000);
    map[date].totalMinutes += minutes;
    map[date].count += 1;
    map[date].records.push(r);
  }

  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function formatHHMM(ts: number, timeFormat: '12h' | '24h' = '12h'): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  if (timeFormat === '24h') {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const ampm = h < 12 ? '오전' : '오후';
  return `${ampm} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
}
