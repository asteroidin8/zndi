import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenPlaceholder title="홈" />
    </SafeAreaView>
  );
}
