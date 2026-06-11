import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseProvider } from '@/db/DatabaseProvider';
import { useFastingNotification } from '@/hooks/useFastingNotification';

function AppContent() {
  const colorScheme = useColorScheme();
  useFastingNotification();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
