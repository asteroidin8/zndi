import { formatMetric } from '@/utils/formatMetric';

describe('formatMetric', () => {
  it('returns 미설정 for null', () => {
    expect(formatMetric(null, 'kg')).toBe('미설정');
  });

  it('formats integer values without decimal', () => {
    expect(formatMetric(70, 'kg')).toBe('70 kg');
  });

  it('formats fractional values with one decimal', () => {
    expect(formatMetric(70.5, 'kg')).toBe('70.5 kg');
  });

  it('rounds to one decimal place', () => {
    expect(formatMetric(70.456, 'kg')).toBe('70.5 kg');
  });

  it('drops trailing zero for round numbers', () => {
    expect(formatMetric(175.0, 'cm')).toBe('175 cm');
  });
});
