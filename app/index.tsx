import { Redirect } from 'expo-router';

import { useSettingsStore } from '@/stores/useSettingsStore';

export default function Index() {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  return <Redirect href={onboardingCompleted ? '/(tabs)' : '/onboarding'} />;
}
