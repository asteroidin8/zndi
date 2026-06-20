import { groupFastingByDay, formatMinutes, formatHHMM } from '@/utils/statsHelper';
import type { CompletedFastingRecord } from '@/utils/statsHelper';

describe('formatMinutes', () => {
  it('returns minutes only when less than 60', () => {
    expect(formatMinutes(45)).toBe('45분');
  });

  it('returns hours only when exact', () => {
    expect(formatMinutes(120)).toBe('2시간');
  });

  it('returns hours and minutes', () => {
    expect(formatMinutes(150)).toBe('2시간 30분');
  });

  it('returns 0분 for zero', () => {
    expect(formatMinutes(0)).toBe('0분');
  });
});

describe('formatHHMM', () => {
  it('formats morning time with 오전', () => {
    const ts = new Date('2026-06-20T09:05:00').getTime();
    expect(formatHHMM(ts)).toBe('오전 9:05');
  });

  it('formats afternoon time with 오후', () => {
    const ts = new Date('2026-06-20T14:30:00').getTime();
    expect(formatHHMM(ts)).toBe('오후 2:30');
  });

  it('formats midnight as 오전 12:00', () => {
    const ts = new Date('2026-06-20T00:00:00').getTime();
    expect(formatHHMM(ts)).toBe('오전 12:00');
  });

  it('formats noon as 오후 12:00', () => {
    const ts = new Date('2026-06-20T12:00:00').getTime();
    expect(formatHHMM(ts)).toBe('오후 12:00');
  });
});

describe('groupFastingByDay', () => {
  const makeRecord = (
    id: string,
    date: string,
    durationMinutes: number,
    result: 'completed' | 'abandoned' = 'completed',
  ): CompletedFastingRecord => {
    const start = new Date(`${date}T08:00:00Z`).getTime();
    return {
      id,
      startedAt: start,
      endedAt: start + durationMinutes * 60_000,
      goalHours: 16,
      result,
    };
  };

  it('groups records by date', () => {
    const records = [
      makeRecord('1', '2026-06-20', 60),
      makeRecord('2', '2026-06-20', 120),
      makeRecord('3', '2026-06-19', 90),
    ];

    const result = groupFastingByDay(records);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-06-20');
    expect(result[0].count).toBe(2);
    expect(result[0].totalMinutes).toBe(180);
    expect(result[1].date).toBe('2026-06-19');
    expect(result[1].count).toBe(1);
  });

  it('sorts by date descending', () => {
    const records = [
      makeRecord('1', '2026-06-18', 60),
      makeRecord('2', '2026-06-20', 60),
      makeRecord('3', '2026-06-19', 60),
    ];

    const result = groupFastingByDay(records);
    expect(result.map((r) => r.date)).toEqual(['2026-06-20', '2026-06-19', '2026-06-18']);
  });

  it('returns empty array for no records', () => {
    expect(groupFastingByDay([])).toEqual([]);
  });
});
