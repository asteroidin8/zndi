import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseProvider } from '@/db/DatabaseProvider';
import { useFastingNotification } from '@/hooks/useFastingNotification';
import { useMidnightArchive } from '@/hooks/useMidnightArchive';
import { useRoutineNotifications } from '@/hooks/useRoutineNotifications';
import { useTodoNotifications } from '@/hooks/useTodoNotifications';
import { useThemeColors } from '@/hooks/useThemeColors';

function AppContent() {
  const c = useThemeColors();
  const isDark = c.surface === '#0a0a0a';
  useFastingNotification();
  useMidnightArchive();
  useRoutineNotifications();
  useTodoNotifications();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

// GestureHandlerRootView가 구 빌드에서 undefined일 수 있으므로 안전하게 폴백
const SafeGestureRoot = GestureHandlerRootView ?? View;

export default function RootLayout() {
  return (
    <SafeGestureRoot style={{ flex: 1 }}>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </SafeGestureRoot>
  );
}
