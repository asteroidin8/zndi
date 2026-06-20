import { formatDueDate, getTimeGreeting } from '@/utils/dateFormat';

describe('formatDueDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-20T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 오늘 for today', () => {
    const result = formatDueDate('2026-06-20');
    expect(result.label).toBe('오늘');
    expect(result.isOverdue).toBe(false);
    expect(result.urgency).toBe('today');
  });

  it('returns 내일 for tomorrow', () => {
    const result = formatDueDate('2026-06-21');
    expect(result.label).toBe('내일');
    expect(result.urgency).toBe('soon');
  });

  it('returns 모레 for day after tomorrow', () => {
    const result = formatDueDate('2026-06-22');
    expect(result.label).toBe('모레');
    expect(result.urgency).toBe('soon');
  });

  it('returns D-N for future dates beyond 3 days', () => {
    const result = formatDueDate('2026-06-25');
    expect(result.label).toBe('D-5');
    expect(result.urgency).toBe('normal');
  });

  it('returns D+N for overdue dates', () => {
    const result = formatDueDate('2026-06-18');
    expect(result.label).toBe('D+2');
    expect(result.isOverdue).toBe(true);
    expect(result.urgency).toBe('overdue');
  });
});

describe('getTimeGreeting', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns morning greeting before noon', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-20T09:00:00'));
    expect(getTimeGreeting()).toBe('좋은 아침이에요');
  });

  it('returns afternoon greeting between 12 and 18', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-20T15:00:00'));
    expect(getTimeGreeting()).toBe('좋은 오후예요');
  });

  it('returns evening greeting after 18', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-20T20:00:00'));
    expect(getTimeGreeting()).toBe('좋은 저녁이에요');
  });
});
