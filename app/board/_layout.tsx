import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const animation = Platform.OS === 'ios' ? 'default' : 'slide_from_right';

export default function BoardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="join" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="friend" />
    </Stack>
  );
}
