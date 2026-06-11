import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { DailySummaryRow } from '@/components/DailySummaryRow';
import { FastingCard } from '@/components/FastingCard';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTabNavigation } from '@/contexts/TabNavigationContext';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getTodayLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = WEEKDAYS[now.getDay()];
  return `${year}년 ${month}월 ${date}일 ${day}요일`;
}

export default function HomeScreen() {
  const c = useThemeColors();
  const { navigateTo } = useTabNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <AppText variant="caption" tone="tertiary">
            {getTodayLabel()}
          </AppText>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
          >
            <AppIcon name="Settings" size={20} color={c.inkTertiary} />
          </Pressable>
        </View>

        {/* 단식 히어로 카드 */}
        <FastingCard onPress={() => navigateTo(0)} />

        {/* 루틴·투두 간략 섹션 */}
        <DailySummaryRow
          onRoutinePress={() => navigateTo(1)}
          onTodoPress={() => navigateTo(3)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
