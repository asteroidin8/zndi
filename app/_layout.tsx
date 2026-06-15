import '../global.css';

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { CloudSyncBridge } from '@/components/CloudSyncBridge';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useFastingNotification } from '@/hooks/useFastingNotification';
import { useMidnightArchive } from '@/hooks/useMidnightArchive';
import { useRoutineNotifications } from '@/hooks/useRoutineNotifications';
import { useTodoNotifications } from '@/hooks/useTodoNotifications';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { initSentry } from '@/utils/sentry';
import { setupNotificationHandler } from '@/utils/notifications';

function AppContent() {
  const c = useThemeColors();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme !== 'light');

  useEffect(() => {
    initSentry();
    setupNotificationHandler();
  }, []);

  useFastingNotification();
  useMidnightArchive();
  useRoutineNotifications();
  useTodoNotifications();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const SafeGestureRoot = GestureHandlerRootView ?? View;

export default function RootLayout() {
  return (
    <SafeGestureRoot style={{ flex: 1 }}>
      <AppErrorBoundary>
        <AuthProvider>
          <CloudSyncBridge />
          <AppContent />
        </AuthProvider>
      </AppErrorBoundary>
    </SafeGestureRoot>
  );
}
