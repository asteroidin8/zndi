import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

/** 업데이트 전 기존 사용자 — 저장 데이터가 있으면 온보딩 스킵 */
export function isExistingUser(): boolean {
  const { records, status } = useFastingStore.getState();
  if (records.length > 0 || status === 'fasting') return true;

  if (useRoutineStore.getState().routines.length > 0) return true;
  if (useTodoStore.getState().todos.length > 0) return true;

  const profile = useUserStore.getState().profile;
  return (
    profile.heightCm != null ||
    profile.weightKg != null ||
    profile.targetWeightKg != null ||
    profile.ageYears != null ||
    profile.isMale != null
  );
}

export function migrateOnboardingForExistingUser(): void {
  const { onboardingCompleted, setOnboardingCompleted } = useSettingsStore.getState();
  if (!onboardingCompleted && isExistingUser()) {
    setOnboardingCompleted(true);
  }
}
