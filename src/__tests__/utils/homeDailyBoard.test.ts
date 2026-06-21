import { toDateStr, getDayDotStatus, getRoutineProgressForDate, getActiveTodoCount } from '@/utils/homeDailyBoard';

describe('toDateStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date('2026-06-20T15:30:00Z');
    expect(toDateStr(date)).toBe('2026-06-20');
  });
});

describe('getDayDotStatus', () => {
  it('returns none when total is 0', () => {
    expect(getDayDotStatus(0, 0)).toBe('none');
  });

  it('returns empty when none completed', () => {
    expect(getDayDotStatus(0, 3)).toBe('empty');
  });

  it('returns partial when some completed', () => {
    expect(getDayDotStatus(2, 5)).toBe('partial');
  });

  it('returns full when all completed', () => {
    expect(getDayDotStatus(3, 3)).toBe('full');
  });

  it('returns full when completed exceeds total', () => {
    expect(getDayDotStatus(5, 3)).toBe('full');
  });
});

describe('getRoutineProgressForDate', () => {
  const routines = [
    { id: 'r1', name: '운동', repeatType: 'weekly' as const, repeatDays: [1, 3, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], monthDates: [] as number[], reminderTime: null, createdAt: 0, order: 0, groupId: null },
    { id: 'r2', name: '독서', repeatType: 'weekly' as const, repeatDays: [1, 2, 3, 4, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], monthDates: [] as number[], reminderTime: null, createdAt: 0, order: 1, groupId: null },
  ];

  it('counts routines for a given day of week', () => {
    const isCompleted = (id: string) => id === 'r1';
    const result = getRoutineProgressForDate('2026-06-22', 1, routines, isCompleted);
    expect(result.total).toBe(2);
    expect(result.completed).toBe(1);
  });

  it('returns 0/0 for days with no routines', () => {
    const isCompleted = () => false;
    const result = getRoutineProgressForDate('2026-06-21', 0, routines, isCompleted);
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
  });
});

describe('getActiveTodoCount', () => {
  it('counts non-completed todos', () => {
    const todos = [
      { id: '1', text: 'a', completedAt: null, priority: 'mid' as const, createdAt: 0, order: 0 },
      { id: '2', text: 'b', completedAt: 12345, priority: 'mid' as const, createdAt: 0, order: 1 },
      { id: '3', text: 'c', completedAt: null, priority: 'mid' as const, createdAt: 0, order: 2 },
    ];
    expect(getActiveTodoCount(todos as any)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(getActiveTodoCount([])).toBe(0);
  });
});
