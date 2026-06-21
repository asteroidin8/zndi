import { router } from 'expo-router';
import { useRef } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailySummaryRow } from '@/components/DailySummaryRow';
import { FastingCard } from '@/components/FastingCard';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { HomeWeeklyGrass } from '@/components/home/HomeWeeklyGrass';
import { InfoBanner } from '@/components/InfoBanner';
import { spacing } from '@/constants/spacing';
import { useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/stores/useUserStore';
import { isProfileIncomplete } from '@/utils/profile';

const TAB_INDEX = 0 as const;

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
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
          paddingBottom: spacing.section * 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeTopBar />

        <HomeWeeklyGrass />

        {isProfileBannerVisible && (
          <InfoBanner
            title="프로필을 설정하면 칼로리 계산이 가능해요"
            onPress={() => router.push('/settings/body')}
            accessibilityLabel="프로필 설정하기"
          />
        )}

        <FastingCard />

        <DailySummaryRow onRoutinePress={() => navigateTo(1)} onTodoPress={() => navigateTo(2)} />
      </ScrollView>
    </SafeAreaView>
  );
}
