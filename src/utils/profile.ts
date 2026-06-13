import type { UserProfile } from '@/stores/useUserStore';

export function isProfileIncomplete(profile: UserProfile): boolean {
  return (
    profile.heightCm == null ||
    profile.weightKg == null ||
    profile.ageYears == null ||
    profile.isMale == null
  );
}
