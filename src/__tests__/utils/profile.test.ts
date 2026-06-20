import { isProfileIncomplete } from '@/utils/profile';

describe('isProfileIncomplete', () => {
  const completeProfile = {
    heightCm: 175,
    weightKg: 70,
    ageYears: 25,
    isMale: true,
    targetWeightKg: null,
    nickname: null,
  };

  it('returns false for complete profile', () => {
    expect(isProfileIncomplete(completeProfile)).toBe(false);
  });

  it('returns true when heightCm is null', () => {
    expect(isProfileIncomplete({ ...completeProfile, heightCm: null })).toBe(true);
  });

  it('returns true when weightKg is null', () => {
    expect(isProfileIncomplete({ ...completeProfile, weightKg: null })).toBe(true);
  });

  it('returns true when ageYears is null', () => {
    expect(isProfileIncomplete({ ...completeProfile, ageYears: null })).toBe(true);
  });

  it('returns true when isMale is null', () => {
    expect(isProfileIncomplete({ ...completeProfile, isMale: null })).toBe(true);
  });
});
