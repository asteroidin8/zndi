import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAppHydrated } from '@/hooks/useAppHydrated';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { migrateOnboardingForExistingUser } from '@/utils/onboardingMigration';

export default function Index() {
  const hydrated = useAppHydrated();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    migrateOnboardingForExistingUser();
    setReady(true);
  }, [hydrated]);

  if (!ready) return null;

  const skipOnboarding = useSettingsStore.getState().onboardingCompleted;
  return <Redirect href={skipOnboarding ? '/(tabs)' : '/onboarding'} />;
}
