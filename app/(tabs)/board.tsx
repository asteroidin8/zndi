import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { TabScreenShell } from '@/components/TabScreenShell';
import { getGrassColor, getCellBorderRadius, GRASS_OPACITY } from '@/constants/grassTheme';
import { radius, spacing } from '@/constants/spacing';
import { WEEKDAY_SHORT } from '@/constants/statsLabels';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBoardStore } from '@/stores/useBoardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFollowStore } from '@/stores/useFollowStore';
import { fetchMyBoards } from '@/services/board/boardService';
import { fetchFollowing, fetchFriendProgress } from '@/services/social/followService';
import { getAvatarColor, getInitial } from '@/utils/avatarColor';
import { getWeekDates, ratioToLevel } from '@/utils/boardHelpers';
import { localDateStr } from '@/utils/dateFormat';

const TAB_INDEX = 0 as const;

type Tab = 'boards' | 'friends';

export default function BoardTabScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('boards');

  const boards = useBoardStore((s) => s.boards);
  const members = useBoardStore((s) => s.members);
  const following = useFollowStore((s) => s.following);
  const friendProgress = useFollowStore((s) => s.friendProgress);

  useEffect(() => {
    if (user?.id) {
      void fetchMyBoards(user.id);
      void fetchFollowing();
    }
  }, [user?.id]);

  useEffect(() => {
    if (tab === 'friends') {
      for (const f of following) {
        void fetchFriendProgress(f.userId);
      }
    }
  }, [tab, following]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = localDateStr();
  const grassHex = getGrassColor(useSettingsStore((s) => s.grassColor));
  const grassCellShape = useSettingsStore((s) => s.grassShape);
  const grassOpacity = GRASS_OPACITY;

  const friendStats = useMemo(() => {
    return following.map((friend) => {
      const progress = friendProgress[friend.userId] ?? [];
      const todayEntry = progress.find((p) => p.date === todayStr);
      const todayTotal = (todayEntry?.routineTotal ?? 0) + (todayEntry?.todoTotal ?? 0);
      const todayCompleted = (todayEntry?.routineCompleted ?? 0) + (todayEntry?.todoCompleted ?? 0);
      const rate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
      const streak = todayEntry?.streak ?? 0;

      const weekGrass = weekDates.map((date) => {
        const entry = progress.find((p) => p.date === date);
        if (!entry) return 0;
        const total = entry.routineTotal + entry.todoTotal;
        if (total === 0) return 0;
        return ratioToLevel((entry.routineCompleted + entry.todoCompleted) / total);
      });

      return { friend, rate, streak, weekGrass };
    });
  }, [following, friendProgress, weekDates, todayStr]);

  return (
    <TabScreenShell>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          paddingTop: spacing.card,
          paddingBottom: spacing.sm,
        }}
      >
        <AppText variant="title">보드</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {tab === 'boards' ? (
            <>
              <Pressable
                onPress={() => router.push('/board/join')}
                hitSlop={8}
                style={{ padding: 4 }}
                accessibilityLabel="보드 참가"
              >
                <AppIcon name="UserPlus" size={20} color={c.inkTertiary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/board/create')}
                hitSlop={8}
                style={{ padding: 4 }}
                accessibilityLabel="보드 만들기"
              >
                <AppIcon name="Plus" size={20} color={c.primary} />
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push('/board/search')}
              hitSlop={8}
              style={{ padding: 4 }}
              accessibilityLabel="친구 검색"
            >
              <AppIcon name="Search" size={20} color={c.primary} />
            </Pressable>
          )}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: spacing.screen,
          marginBottom: spacing.md,
          backgroundColor: c.surfaceMuted,
          borderRadius: radius.md,
          padding: 3,
        }}
      >
        {(['boards', 'friends'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.md - 2,
              backgroundColor: tab === t ? c.surfaceSubtle : 'transparent',
              alignItems: 'center',
            }}
          >
            <AppText
              variant="caption"
              style={{
                fontWeight: '600',
                color: tab === t ? c.ink : c.inkTertiary,
              }}
            >
              {t === 'boards' ? '보드' : '친구'}
            </AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          { padding: spacing.screen, gap: spacing.md },
          (tab === 'boards' ? boards.length === 0 : following.length === 0) && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'boards' ? (
          boards.length === 0 ? (
            <EmptyState
              variant="stats"
              message={'보드를 만들거나\n초대 코드로 참가해보세요'}
            />
          ) : (
            boards.map((board) => {
              const boardMembers = members[board.id] ?? [];
              const sorted = [...boardMembers].sort((a, b) =>
                a.userId === board.ownerId ? -1 : b.userId === board.ownerId ? 1 : 0,
              );
              const AVATAR_SIZE = 28;
              const OVERLAP = 8;
              const maxShow = 5;
              const visible = sorted.slice(0, maxShow);
              const extra = sorted.length - maxShow;
              return (
                <Pressable
                  key={board.id}
                  onPress={() => router.push(`/board/${board.id}`)}
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.card,
                    borderRadius: radius.md,
                    backgroundColor: c.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: c.borderNeutral,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <AppText variant="body" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
                      {board.name}
                    </AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {visible.map((m, i) => {
                        const isOwner = m.userId === board.ownerId;
                        return (
                          <View
                            key={m.userId}
                            style={{
                              marginLeft: i === 0 ? 0 : -OVERLAP,
                              zIndex: visible.length - i,
                            }}
                          >
                            {isOwner && (
                              <View style={{ alignItems: 'center', marginBottom: -2 }}>
                                <AppIcon name="Crown" size={10} color={c.primary} />
                              </View>
                            )}
                            <View
                              style={{
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                borderRadius: AVATAR_SIZE / 2,
                                backgroundColor: getAvatarColor(m.userId),
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: c.surfaceSubtle,
                              }}
                            >
                              <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                                {getInitial(m.nickname)}
                              </AppText>
                            </View>
                          </View>
                        );
                      })}
                      {extra > 0 && (
                        <View
                          style={{
                            marginLeft: -OVERLAP,
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            borderRadius: AVATAR_SIZE / 2,
                            backgroundColor: c.surfaceMuted,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: c.surfaceSubtle,
                          }}
                        >
                          <AppText style={{ color: c.inkTertiary, fontWeight: '700', fontSize: 10 }}>
                            +{extra}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppIcon name="ChevronRight" size={16} color={c.inkDisabled} />
                  </View>
                </Pressable>
              );
            })
          )
        ) : following.length === 0 ? (
          <EmptyState
            variant="stats"
            message={'닉네임으로 친구를 검색하고\n잔디를 구경해보세요'}
          />
        ) : (
          <>
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

            {friendStats.map(({ friend, rate, streak, weekGrass }) => (
              <Pressable
                key={friend.userId}
                onPress={() =>
                  router.push({
                    pathname: '/board/friend',
                    params: { userId: friend.userId, nickname: friend.nickname },
                  })
                }
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
                    {friend.nickname}
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
                        borderRadius: getCellBorderRadius(grassCellShape, 28),
                        backgroundColor: level === 0 ? c.surfaceMuted : grassHex,
                        opacity: level === 0 ? 1 : grassOpacity[level],
                        borderWidth: level === 0 ? 1 : 0,
                        borderColor: c.border,
                      }}
                    />
                  ))}
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </TabScreenShell>
  );
}
