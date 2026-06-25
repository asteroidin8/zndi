import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const animation = Platform.OS === 'ios' ? 'default' : 'slide_from_right';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="body" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="about" />
      <Stack.Screen name="membership" />
      <Stack.Screen name="theme-shop" />
      <Stack.Screen name="avatar-collection" />
    </Stack>
  );
}
