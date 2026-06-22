import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBoardStore } from '@/stores/useBoardStore';
import { leaveBoard } from '@/services/board/boardService';
import { localDateStr } from '@/utils/dateFormat';

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(localDateStr(d));
  }
  return dates;
}

export default function BoardDetailScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const board = useBoardStore((s) => s.boards.find((b) => b.id === id));
  const members = useBoardStore((s) => s.members[id ?? ''] ?? []);
  const progress = useBoardStore((s) => s.progress[id ?? ''] ?? []);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = localDateStr();

  const memberStats = useMemo(() => {
    return members.map((member) => {
      const memberProgress = progress.filter((p) => p.userId === member.userId);
      const todayEntry = memberProgress.find((p) => p.date === todayStr);
      const todayTotal = (todayEntry?.routineTotal ?? 0) + (todayEntry?.todoTotal ?? 0);
      const todayCompleted = (todayEntry?.routineCompleted ?? 0) + (todayEntry?.todoCompleted ?? 0);
      const rate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
      const streak = todayEntry?.streak ?? 0;

      const weekGrass = weekDates.map((date) => {
        const entry = memberProgress.find((p) => p.date === date);
        if (!entry) return 0;
        const total = entry.routineTotal + entry.todoTotal;
        if (total === 0) return 0;
        const completed = entry.routineCompleted + entry.todoCompleted;
        const ratio = completed / total;
        if (ratio >= 1) return 4;
        if (ratio >= 0.75) return 3;
        if (ratio >= 0.5) return 2;
        if (ratio > 0) return 1;
        return 0;
      });

      return { member, rate, streak, weekGrass };
    });
  }, [members, progress, weekDates, todayStr]);

  if (!board) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
        <PageHeader title="보드" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="body" tone="tertiary">보드를 찾을 수 없어요.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user?.id === board.ownerId;

  function handleShareCode() {
    void Share.share({ message: `zndi 보드에 참가하세요!\n초대 코드: ${board!.inviteCode}` });
  }

  function handleLeave() {
    Alert.alert(
      isOwner ? '보드 삭제' : '보드 나가기',
      isOwner ? '보드를 삭제하면 모든 멤버가 제거됩니다.' : '이 보드를 나갈까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: isOwner ? '삭제' : '나가기',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            await leaveBoard(user.id, board!.id);
            router.back();
          },
        },
      ],
    );
  }

  const grassOpacity = [0, 0.2, 0.4, 0.65, 1];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.screen }}>
        <PageHeader title={board.name} onBack={() => router.back()} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={handleShareCode} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="초대 코드 공유">
            <AppIcon name="Share2" size={18} color={c.inkTertiary} />
          </Pressable>
          <Pressable onPress={handleLeave} hitSlop={8} style={{ padding: 4 }} accessibilityLabel={isOwner ? '보드 삭제' : '보드 나가기'}>
            <AppIcon name="LogOut" size={18} color={c.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ alignItems: 'center', gap: spacing.xs }}>
          <AppText variant="caption" tone="tertiary">초대 코드</AppText>
          <AppText variant="title" style={{ fontSize: 24, fontWeight: '700', letterSpacing: 4 }}>
            {board.inviteCode}
          </AppText>
        </Card>

        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end', paddingRight: 4 }}>
            {weekDates.map((date) => {
              const d = new Date(`${date}T00:00:00`);
              return (
                <View key={date} style={{ width: 28, alignItems: 'center' }}>
                  <AppText variant="caption" tone="disabled" style={{ fontSize: 9 }}>
                    {WEEKDAY_SHORT[d.getDay()]}
                  </AppText>
                </View>
              );
            })}
          </View>

          {memberStats.map(({ member, rate, streak, weekGrass }) => (
            <View
              key={member.userId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: c.borderNeutral,
                gap: spacing.sm,
              }}
            >
              <View style={{ flex: 1, minWidth: 60 }}>
                <AppText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {member.nickname}
                </AppText>
                <AppText variant="caption" tone="tertiary">
                  {rate}% · 🔥{streak}
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                {weekGrass.map((level, i) => (
                  <View
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: level === 0 ? c.surfaceMuted : c.primary,
                      opacity: level === 0 ? 1 : grassOpacity[level],
                      borderWidth: level === 0 ? 1 : 0,
                      borderColor: c.border,
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
