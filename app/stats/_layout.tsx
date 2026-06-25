import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const animation = Platform.OS === 'ios' ? 'default' : 'slide_from_right';

export default function StatsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation }}>
      <Stack.Screen name="fasting" />
      <Stack.Screen name="routine" />
      <Stack.Screen name="todo" />
      <Stack.Screen name="cards" />
      <Stack.Screen name="weight" />
    </Stack>
  );
}
