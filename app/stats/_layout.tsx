import { Stack } from 'expo-router';

export default function StatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="fasting" />
      <Stack.Screen name="routine" />
      <Stack.Screen name="todo" />
      <Stack.Screen name="cards" />
    </Stack>
  );
}
