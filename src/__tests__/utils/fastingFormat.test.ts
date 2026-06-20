import { formatElapsed, formatOverElapsed, formatRelativeDate } from '@/utils/fastingFormat';

describe('formatElapsed', () => {
  it('formats zero', () => {
    expect(formatElapsed(0)).toBe('00:00:00');
  });

  it('formats seconds only', () => {
    expect(formatElapsed(45_000)).toBe('00:00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatElapsed(125_000)).toBe('00:02:05');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatElapsed(3_661_000)).toBe('01:01:01');
  });

  it('handles large values', () => {
    expect(formatElapsed(86_400_000)).toBe('24:00:00');
  });

  it('uses absolute value for negative input', () => {
    expect(formatElapsed(-5000)).toBe('00:00:05');
  });
});

describe('formatOverElapsed', () => {
  it('prepends + to elapsed format', () => {
    expect(formatOverElapsed(3_600_000)).toBe('+01:00:00');
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-20T15:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 오늘 for today', () => {
    const ts = new Date('2026-06-20T10:30:00').getTime();
    const result = formatRelativeDate(ts);
    expect(result.dayLabel).toBe('오늘');
    expect(result.timeLabel).toBe('오전 10:30');
  });

  it('returns 내일 for tomorrow', () => {
    const ts = new Date('2026-06-21T14:00:00').getTime();
    const result = formatRelativeDate(ts);
    expect(result.dayLabel).toBe('내일');
  });

  it('returns 모레 for day after tomorrow', () => {
    const ts = new Date('2026-06-22T08:00:00').getTime();
    const result = formatRelativeDate(ts);
    expect(result.dayLabel).toBe('모레');
  });

  it('returns date string for distant dates', () => {
    const ts = new Date('2026-06-25T10:00:00').getTime();
    const result = formatRelativeDate(ts);
    expect(result.dayLabel).toBe('6/25');
  });

  it('formats PM time correctly', () => {
    const ts = new Date('2026-06-20T16:05:00').getTime();
    const result = formatRelativeDate(ts);
    expect(result.timeLabel).toBe('오후 4:05');
  });
});
