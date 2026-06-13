import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InfoBanner } from '@/components/InfoBanner';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { DailySummaryRow } from '@/components/DailySummaryRow';
import { FastingCard } from '@/components/FastingCard';
import { HomeDailyBoard } from '@/components/HomeDailyBoard';
import { SectionHeader } from '@/components/SectionHeader';
import { spacing } from '@/constants/spacing';
import { useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getTimeGreeting } from '@/utils/dateFormat';
import { useUserStore } from '@/stores/useUserStore';
import { isProfileIncomplete } from '@/utils/profile';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TAB_INDEX = 2 as const;

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
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { navigateTo } = useTabNavigation();
  const { profile } = useUserStore();
  const isProfileBannerVisible = isProfileIncomplete(profile);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="title">{getTimeGreeting()}</AppText>
            <AppText variant="caption" tone="tertiary">
              {getTodayLabel()}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="설정"
          >
            <AppIcon name="Settings" size={20} color={c.inkTertiary} />
          </Pressable>
        </View>

        {isProfileBannerVisible && (
          <InfoBanner
            title="프로필을 설정하면 칼로리 계산이 가능해요"
            description="키, 몸무게 입력하기 →"
            onPress={() => router.push('/settings')}
            accessibilityLabel="프로필 설정하기"
          />
        )}

        <FastingCard onPress={() => navigateTo(0)} />

        <DailySummaryRow
          onRoutinePress={() => navigateTo(1)}
          onTodoPress={() => navigateTo(3)}
        />

        <View style={{ gap: 12 }}>
          <SectionHeader title="이번 주" />
          <HomeDailyBoard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
