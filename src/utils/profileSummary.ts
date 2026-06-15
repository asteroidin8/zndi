import type { UserProfile } from '@/stores/useUserStore';
import { formatMetric } from '@/utils/formatMetric';
import { isProfileIncomplete } from '@/utils/profile';

export function getProfileRowValue(profile: UserProfile): { value: string; unset: boolean } {
  if (isProfileIncomplete(profile)) {
    return { value: '미설정', unset: true };
  }
  const parts = [
    profile.heightCm != null ? formatMetric(profile.heightCm, 'cm') : null,
    profile.weightKg != null ? formatMetric(profile.weightKg, 'kg') : null,
  ].filter(Boolean);
  return { value: parts.length > 0 ? parts.join(' · ') : '미설정', unset: parts.length === 0 };
}
