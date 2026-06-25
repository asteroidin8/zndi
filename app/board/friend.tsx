import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { GrassCell } from '@/components/board/GrassCell';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { getGrassColor } from '@/constants/grassTheme';
import { spacing } from '@/constants/spacing';
import { WEEKDAY_SHORT } from '@/constants/statsLabels';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert } from '@/stores/useAlertStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EMPTY_FRIEND_PROGRESS, useFollowStore } from '@/stores/useFollowStore';
import {
  fetchFriendProgress,
  unfollowUser,
} from '@/services/social/followService';
import { getWeekDates, getMonthDates, ratioToLevel } from '@/utils/boardHelpers';
import { localDateStr } from '@/utils/dateFormat';

export default function FriendProfileScreen() {
  const c = useThemeColors();
  const { userId, nickname } = useLocalSearchParams<{ userId: string; nickname: string }>();
  const progress = useFollowStore((s) => s.friendProgress[userId ?? ''] ?? EMPTY_FRIEND_PROGRESS);

  useEffect(() => {
    if (userId) void fetchFriendProgress(userId);
  }, [userId]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const monthDates = useMemo(() => getMonthDates(), []);
  const todayStr = localDateStr();

  const todayEntry = progress.find((p) => p.date === todayStr);
  const todayTotal = (todayEntry?.routineTotal ?? 0) + (todayEntry?.todoTotal ?? 0);
  const todayCompleted = (todayEntry?.routineCompleted ?? 0) + (todayEntry?.todoCompleted ?? 0);
  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const streak = todayEntry?.streak ?? 0;

  const weekGrass = useMemo(
    () =>
      weekDates.map((date) => {
        const entry = progress.find((p) => p.date === date);
        if (!entry) return 0;
        const total = entry.routineTotal + entry.todoTotal;
        if (total === 0) return 0;
        return ratioToLevel((entry.routineCompleted + entry.todoCompleted) / total);
      }),
    [weekDates, progress],
  );

  const monthGrass = useMemo(
    () =>
      monthDates.map((date) => {
        const entry = progress.find((p) => p.date === date);
        if (!entry) return 0;
        const total = entry.routineTotal + entry.todoTotal;
        if (total === 0) return 0;
        return ratioToLevel((entry.routineCompleted + entry.todoCompleted) / total);
      }),
    [monthDates, progress],
  );

  const grassColorId = useSettingsStore((s) => s.grassColor);
  const grassHex = getGrassColor(grassColorId);
  const grassCellShape = useSettingsStore((s) => s.grassShape);

  function handleUnfollow() {
    appAlert('팔로우 취소', `${nickname}님을 언팔로우할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '언팔로우',
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          await unfollowUser(userId);
          useFollowStore.getState().removeFollowing(userId);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.screen }}>
        <PageHeader title={nickname ?? ''} onBack={() => router.back()} />
        <Pressable onPress={handleUnfollow} hitSlop={8} style={{ padding: 4 }}>
          <AppIcon name="UserMinus" size={18} color={c.danger} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today summary */}
        <Card style={{ alignItems: 'center', gap: spacing.xs }}>
          <AppText variant="caption" tone="tertiary">오늘 달성률</AppText>
          <AppText variant="title" style={{ fontSize: 32, fontWeight: '700', color: c.primary }}>
            {todayRate}%
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name="Flame" size={14} color={c.accent} />
            <AppText variant="caption" style={{ fontWeight: '600', color: c.accent }}>
              {streak}일 연속
            </AppText>
          </View>
        </Card>

        {/* Weekly grass */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
            주간 잔디
          </AppText>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
            {weekDates.map((date, i) => {
              const d = new Date(`${date}T00:00:00`);
              return (
                <View key={date} style={{ alignItems: 'center', gap: 4 }}>
                  <AppText variant="caption" tone="disabled" style={{ fontSize: 9 }}>
                    {WEEKDAY_SHORT[d.getDay()]}
                  </AppText>
                  <GrassCell level={weekGrass[i]} size={36} grassHex={grassHex} shape={grassCellShape} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Monthly grass grid */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
            최근 30일
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {monthGrass.map((level, i) => (
              <GrassCell key={i} level={level} size={28} grassHex={grassHex} shape={grassCellShape} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
            <AppText variant="caption" tone="disabled" style={{ fontSize: 9 }}>적음</AppText>
            {[0, 1, 2, 3, 4].map((level) => (
              <GrassCell key={level} level={level} size={12} grassHex={grassHex} shape={grassCellShape} />
            ))}
            <AppText variant="caption" tone="disabled" style={{ fontSize: 9 }}>많음</AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
