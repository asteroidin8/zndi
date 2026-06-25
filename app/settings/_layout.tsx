import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="body" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="about" />
      <Stack.Screen name="membership" />
      <Stack.Screen name="theme-shop" />
      <Stack.Screen name="avatar-collection" />
    </Stack>
  );
}
