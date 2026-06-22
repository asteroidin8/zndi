import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailySummaryRow } from '@/components/DailySummaryRow';
import { FastingCard } from '@/components/FastingCard';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { HomeWeeklyGrass } from '@/components/home/HomeWeeklyGrass';
import { InfoBanner } from '@/components/InfoBanner';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBoardStore } from '@/stores/useBoardStore';
import { useUserStore } from '@/stores/useUserStore';
import { fetchMyBoards } from '@/services/board/boardService';
import { fetchBoardRoutines, fetchVerificationLogs } from '@/services/board/boardRoutineService';
import { localDateStr } from '@/utils/dateFormat';
import { isProfileIncomplete } from '@/utils/profile';

const TAB_INDEX = 0 as const;

export default function HomeScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { navigateTo } = useTabNavigation();
  const { user } = useAuth();
  const { profile } = useUserStore();
  const isProfileBannerVisible = isProfileIncomplete(profile);

  const boards = useBoardStore((s) => s.boards);
  const allRoutines = useBoardStore((s) => s.routines);
  const allLogs = useBoardStore((s) => s.logs);

  useEffect(() => {
    if (!user?.id) return;
    void fetchMyBoards(user.id);
  }, [user?.id]);

  useEffect(() => {
    for (const board of boards) {
      void fetchBoardRoutines(board.id);
      void fetchVerificationLogs(board.id);
    }
  }, [boards]);

  const unverifiedCount = useMemo(() => {
    if (!user?.id || boards.length === 0) return 0;
    const today = localDateStr();
    let count = 0;
    for (const board of boards) {
      const routines = allRoutines[board.id] ?? [];
      const logs = allLogs[board.id] ?? [];
      for (const routine of routines) {
        const verified = logs.some(
          (l) => l.userId === user.id && l.routineId === routine.id && localDateStr(new Date(l.createdAt)) === today,
        );
        if (!verified) count++;
      }
    }
    return count;
  }, [user?.id, boards, allRoutines, allLogs]);

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

        {unverifiedCount > 0 && (
          <InfoBanner
            title={`오늘 미인증 공동 루틴 ${unverifiedCount}개`}
            icon="Users"
            onPress={() => router.push('/board')}
            accessibilityLabel="보드로 이동"
          />
        )}

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
