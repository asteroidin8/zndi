import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { DailySummaryRow } from '@/components/DailySummaryRow';
import { FastingCard } from '@/components/FastingCard';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { HomeWeeklyGrass } from '@/components/home/HomeWeeklyGrass';
import { InfoBanner } from '@/components/InfoBanner';
import { SkeletonBox } from '@/components/Skeleton';
import {
  StreakMilestoneModal,
  getUnseenMilestone,
  type StreakMilestone,
} from '@/components/StreakMilestoneModal';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useBoardStore } from '@/stores/useBoardStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserStore } from '@/stores/useUserStore';
import { fetchMyBoards } from '@/services/board/boardService';
import { fetchBoardRoutines, fetchVerificationLogs } from '@/services/board/boardRoutineService';
import { localDateStr } from '@/utils/dateFormat';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';
import { feedbackRefresh, feedbackSuccess } from '@/utils/microFeedback';
import { isProfileIncomplete } from '@/utils/profile';

const TAB_INDEX = 2 as const;

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { navigateTo } = useTabNavigation();
  const { user } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const isProfileBannerVisible = isProfileIncomplete(profile);
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestoneToShow, setMilestoneToShow] = useState<StreakMilestone | null>(null);

  const routines = useRoutineStore((s) => s.routines);
  const completions = useRoutineCompletionStore((s) => s.completions);
  const celebratedStreaks = useSettingsStore((s) => s.celebratedStreaks);

  const handleAllComplete = useCallback(() => {
    feedbackSuccess();
    setShowConfetti(true);

    const { isCompleted } = useRoutineCompletionStore.getState();
    const streak = getRoutineStreakDays(routines, isCompleted);
    const unseen = getUnseenMilestone(streak, celebratedStreaks);
    if (unseen) {
      setTimeout(() => setMilestoneToShow(unseen), 800);
    }
  }, [routines, celebratedStreaks]);

  const handleConfettiFinish = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const handleMilestoneClose = useCallback(() => {
    if (milestoneToShow) {
      useSettingsStore.getState().markStreakCelebrated(milestoneToShow);
    }
    setMilestoneToShow(null);
  }, [milestoneToShow]);

  const boards = useBoardStore((s) => s.boards);
  const allRoutines = useBoardStore((s) => s.routines);
  const allLogs = useBoardStore((s) => s.logs);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id) { setInitialLoading(false); return; }
    fetchMyBoards(user.id).finally(() => setInitialLoading(false));
  }, [user?.id]);

  useEffect(() => {
    for (const board of boards) {
      void fetchBoardRoutines(board.id);
      void fetchVerificationLogs(board.id);
    }
  }, [boards]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    feedbackRefresh();
    setRefreshing(true);
    try {
      await fetchMyBoards(user.id);
      for (const board of boards) {
        await fetchBoardRoutines(board.id);
        await fetchVerificationLogs(board.id);
      }
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, boards]);

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
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.screen }}>
        <HomeTopBar />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: spacing.screen,
          paddingTop: spacing.section,
          gap: spacing.section,
          paddingBottom: spacing.section * 2,
        }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {initialLoading ? (
          <View style={{ gap: spacing.section }}>
            <SkeletonBox height={80} rounded="lg" />
            <SkeletonBox height={120} rounded="lg" />
            <SkeletonBox height={60} rounded="lg" />
          </View>
        ) : (
        <>
        <HomeWeeklyGrass />

        {unverifiedCount > 0 && (
          <InfoBanner
            title={`오늘 미인증 공동 루틴 ${unverifiedCount}개`}
            icon="Users"
            onPress={() => navigateTo(0)}
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

        <DailySummaryRow
          onRoutinePress={() => navigateTo(1)}
          onTodoPress={() => navigateTo(3)}
          onAllComplete={handleAllComplete}
        />
        </>
        )}
      </ScrollView>
      <ConfettiCelebration visible={showConfetti} onFinish={handleConfettiFinish} />
      <StreakMilestoneModal
        milestone={milestoneToShow ?? 7}
        streak={getRoutineStreakDays(routines, useRoutineCompletionStore.getState().isCompleted)}
        visible={milestoneToShow !== null}
        onClose={handleMilestoneClose}
      />
    </View>
  );
}
