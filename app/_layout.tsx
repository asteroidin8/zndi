import '../global.css';
import '@/widgets/register';

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppAlert } from '@/components/AppAlert';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { CloudSyncBridge } from '@/components/CloudSyncBridge';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBoardProgressSync } from '@/hooks/useBoardProgressSync';
import { useBoardRealtimeSync } from '@/hooks/useBoardRealtimeSync';
import { useFastingNotification } from '@/hooks/useFastingNotification';
import { useMidnightArchive } from '@/hooks/useMidnightArchive';
import { useRoutineNotifications } from '@/hooks/useRoutineNotifications';
import { useTodoNotifications } from '@/hooks/useTodoNotifications';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { initSentry } from '@/utils/sentry';
import { setupNotificationHandler } from '@/utils/notifications';
import { useWidgetSync } from '@/widgets/useWidgetSync';

if (__DEV__) {
  LogBox.ignoreLogs([
    'Sentry Logger',
    '[Native] [Sentry]',
    'Current session is not ended',
  ]);
}

function AppContent() {
  const c = useThemeColors();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme !== 'light');

  useEffect(() => {
    initSentry();
    setupNotificationHandler();
  }, []);

  useBoardRealtimeSync();
  useBoardProgressSync();
  useFastingNotification();
  useMidnightArchive();
  useRoutineNotifications();
  useTodoNotifications();
  useWidgetSync();

  const borderColor = `${c.primary}30`;

  return (
    <View style={{ flex: 1, borderLeftWidth: 2, borderRightWidth: 2, borderColor }}>
      <View style={{ height: insets.top, backgroundColor: borderColor }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="board" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
      </Stack>
      <View style={{ height: insets.bottom, backgroundColor: borderColor }} />
    </View>
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
          <AppAlert />
        </AuthProvider>
      </AppErrorBoundary>
    </SafeGestureRoot>
  );
}
