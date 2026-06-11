import './global.css';

import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <Text className="text-ink text-base">routiner</Text>
      <StatusBar style="dark" />
    </View>
  );
}
