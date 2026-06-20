import { getGrassLevel } from '@/utils/grassLevel';

describe('getGrassLevel', () => {
  it('returns 새싹 for 0', () => {
    const result = getGrassLevel(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe('새싹');
  });

  it('returns 새싹 for 30', () => {
    expect(getGrassLevel(30).level).toBe(1);
  });

  it('returns 풀잎 for 31', () => {
    expect(getGrassLevel(31).level).toBe(2);
    expect(getGrassLevel(31).name).toBe('풀잎');
  });

  it('returns 잔디밭 for 101', () => {
    expect(getGrassLevel(101).level).toBe(3);
  });

  it('returns 정원 for 301', () => {
    expect(getGrassLevel(301).level).toBe(4);
  });

  it('returns 숲 for 701', () => {
    expect(getGrassLevel(701).level).toBe(5);
  });

  it('returns 생태계 for 1501+', () => {
    expect(getGrassLevel(1501).level).toBe(6);
    expect(getGrassLevel(1501).name).toBe('생태계');
  });

  it('returns 생태계 for very large numbers', () => {
    expect(getGrassLevel(99999).level).toBe(6);
  });
});
