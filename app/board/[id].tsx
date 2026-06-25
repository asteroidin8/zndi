import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { SheetModal, SheetPrimaryButton } from '@/components/SheetModal';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { getGrassColor, getCellBorderRadius, GRASS_OPACITY } from '@/constants/grassTheme';
import { radius, spacing } from '@/constants/spacing';
import { WEEKDAY_SHORT } from '@/constants/statsLabels';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert } from '@/stores/useAlertStore';
import {
  EMPTY_BOARD_LOGS,
  EMPTY_BOARD_MEMBERS,
  EMPTY_BOARD_ROUTINES,
  useBoardStore,
} from '@/stores/useBoardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  delegateAdmin,
  fetchBoardMembers,
  insertSystemMessage,
  kickMember,
  leaveBoard,
  refreshInviteCode,
  voteDeleteBoard,
} from '@/services/board/boardService';
import {
  createBoardRoutine,
  deleteBoardRoutine,
  fetchBoardRoutines,
  fetchSystemMessages,
  fetchVerificationLogs,
  pickImage,
  submitVerification,
  takePhoto,
  deleteVerification,
} from '@/services/board/boardRoutineService';
import type { BoardSystemMessage, BoardVerificationLog } from '@/types';
import { useUserStore } from '@/stores/useUserStore';
import { getAvatarColor, getDisplayName, getInitial } from '@/utils/avatarColor';
import { getWeekDates, ratioToLevel } from '@/utils/boardHelpers';
import { localDateStr } from '@/utils/dateFormat';

const EMPTY_BOARD_SYSTEM_MESSAGES: BoardSystemMessage[] = [];

const SYSTEM_MSG_TEXT: Record<BoardSystemMessage['type'], (m: BoardSystemMessage) => string> = {
  routine_created: (m) => `📋 "${m.routineName}" 루틴이 생성되었습니다.`,
  routine_deleted: (m) => `📋 "${m.routineName}" 루틴이 삭제되었습니다.`,
  member_joined: (m) => `👋 ${m.actorNickname}님이 참여했습니다.`,
  member_left: (m) => `${m.actorNickname}님이 탈퇴했습니다.`,
  member_kicked: (m) => `${m.targetNickname}님이 보드에서 나갔습니다.`,
  admin_changed: (m) => `🔑 ${m.targetNickname}님이 관리자가 되었습니다.`,
};

type Tab = 'members' | 'routines' | 'feed';

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type FeedItem =
  | { kind: 'log'; item: BoardVerificationLog }
  | { kind: 'system'; item: BoardSystemMessage };

function FeedTab({
  logs,
  systemMessages,
  user,
  memberNicknames,
  onDeleteLog,
  c,
}: {
  logs: BoardVerificationLog[];
  systemMessages: BoardSystemMessage[];
  user: { id: string } | null | undefined;
  memberNicknames: Map<string, string>;
  onDeleteLog: (log: BoardVerificationLog) => void;
  c: import('@/constants/colors').ThemeColors;
}) {
  const merged = useMemo(() => {
    const items: FeedItem[] = [
      ...logs.map((l): FeedItem => ({ kind: 'log', item: l })),
      ...systemMessages.map((m): FeedItem => ({ kind: 'system', item: m })),
    ];
    items.sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime());
    return items;
  }, [logs, systemMessages]);

  if (merged.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40, gap: spacing.sm }}>
        <AppIcon name="Camera" size={32} color={c.inkDisabled} />
        <AppText variant="body" tone="tertiary">아직 기록이 없어요.</AppText>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {merged.map((entry) => {
        if (entry.kind === 'system') {
          const msg = entry.item;
          return (
            <View key={`sys-${msg.id}`} style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
              <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                {SYSTEM_MSG_TEXT[msg.type](msg)}
              </AppText>
            </View>
          );
        }

        const log = entry.item;
        return (
          <Card key={log.id}>
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: getAvatarColor(log.userId),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText variant="caption" style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                    {getInitial(memberNicknames.get(log.userId) ?? log.nickname ?? '?')}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" style={{ fontWeight: '600' }}>
                    {memberNicknames.get(log.userId) ?? log.nickname ?? '멤버'}
                  </AppText>
                  <AppText variant="caption" tone="tertiary">
                    {log.routineName ?? '루틴'} · {formatLogTime(log.createdAt)}
                  </AppText>
                </View>
                {log.userId === user?.id && (
                  <Pressable onPress={() => onDeleteLog(log)} hitSlop={8} style={{ padding: 4 }}>
                    <AppIcon name="Trash2" size={14} color={c.inkDisabled} />
                  </Pressable>
                )}
              </View>

              <Image
                source={{ uri: log.photoUrl }}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: radius.md,
                  backgroundColor: c.surfaceMuted,
                }}
                resizeMode="cover"
              />

              {log.memo ? (
                <AppText variant="body">{log.memo}</AppText>
              ) : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

export default function BoardDetailScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const board = useBoardStore((s) => s.boards.find((b) => b.id === id));
  const members = useBoardStore((s) => s.members[id ?? ''] ?? EMPTY_BOARD_MEMBERS);
  const allRoutines = useBoardStore((s) => s.routines[id ?? ''] ?? EMPTY_BOARD_ROUTINES);
  const routines = useMemo(() => allRoutines.filter((r) => !r.deletedAt), [allRoutines]);
  const logs = useBoardStore((s) => s.logs[id ?? ''] ?? EMPTY_BOARD_LOGS);
  const systemMessages = useBoardStore((s) => s.systemMessages[id ?? ''] ?? EMPTY_BOARD_SYSTEM_MESSAGES);
  const myNickname = useUserStore((s) => s.profile.nickname);

  const [tab, setTab] = useState<Tab>('members');
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const grassColor = useSettingsStore((s) => s.grassColor);
  const grassCellShape = useSettingsStore((s) => s.grassShape);

  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = localDateStr();

  const memberNicknames = useMemo(
    () => new Map(members.map((m) => [m.userId, m.nickname])),
    [members],
  );

  const myMember = members.find((m) => m.userId === user?.id);
  const isAdmin = myMember?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    void fetchBoardMembers(id);
    void fetchBoardRoutines(id);
    void fetchVerificationLogs(id);
    void fetchSystemMessages(id);
  }, [id]);

  const todayRoutineTotal = routines.length;

  function hasVerified(userId: string, routineId: string, date: string): boolean {
    return logs.some(
      (l) => l.userId === userId && l.routineId === routineId && localDateStr(new Date(l.createdAt)) === date,
    );
  }

  const memberStats = useMemo(() => {
    if (todayRoutineTotal === 0) {
      return members.map((member) => ({
        member,
        rate: 0,
        streak: 0,
        weekGrass: weekDates.map(() => 0),
      }));
    }

    return members.map((member) => {
      const todayVerified = routines.filter((r) =>
        hasVerified(member.userId, r.id, todayStr),
      ).length;
      const rate = Math.round((todayVerified / todayRoutineTotal) * 100);

      const weekGrass = weekDates.map((date) => {
        const verified = routines.filter((r) =>
          hasVerified(member.userId, r.id, date),
        ).length;
        return ratioToLevel(verified / todayRoutineTotal);
      });

      return { member, rate, streak: 0, weekGrass };
    });
  }, [members, routines, logs, weekDates, todayStr, todayRoutineTotal]);

  function handleShareCode() {
    void Share.share({ message: `zndi 보드에 참가하세요!\n초대 코드: ${board!.inviteCode}` });
  }

  function handleLeave() {
    appAlert(
      '보드 나가기',
      isAdmin && members.length > 1
        ? '관리자가 탈퇴하면 가입 순서가 가장 빠른 멤버에게 관리자가 위임됩니다.'
        : members.length === 1
          ? '마지막 멤버가 탈퇴하면 보드가 삭제됩니다.'
          : '이 보드를 나갈까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id || !id) return;
            const displayName = getDisplayName(myNickname, user.id);
            await insertSystemMessage(id, 'member_left', displayName);
            await leaveBoard(user.id, id);
            router.back();
          },
        },
      ],
    );
  }

  function handleVoteDelete() {
    if (!id) return;
    appAlert(
      '보드 삭제 투표',
      '전원 동의 시 보드가 삭제됩니다.\n삭제에 동의하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '동의',
          style: 'destructive',
          onPress: async () => {
            const { deleted, votes, total, error } = await voteDeleteBoard(id);
            if (error) { appAlert('오류', error); return; }
            if (deleted) {
              router.back();
            } else {
              appAlert('투표 완료', `${votes}/${total}명 동의. 전원 동의 시 삭제됩니다.`);
            }
          },
        },
      ],
    );
  }

  function handleDelegateAdmin(targetUserId: string, targetNickname: string) {
    if (!id) return;
    appAlert(
      '관리자 위임',
      `${targetNickname}님에게 관리자를 위임할까요?\n현재 관리자 권한이 해제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '위임',
          onPress: async () => {
            const displayName = getDisplayName(myNickname, user?.id);
            const { error } = await delegateAdmin(id, targetUserId);
            if (error) { appAlert('오류', error); return; }
            void insertSystemMessage(id, 'admin_changed', displayName, targetNickname);
          },
        },
      ],
    );
  }

  function handleKickMember(targetUserId: string, targetNickname: string) {
    if (!id) return;
    appAlert(
      '멤버 추방',
      `${targetNickname}님을 보드에서 추방할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '추방',
          style: 'destructive',
          onPress: async () => {
            const displayName = getDisplayName(myNickname, user?.id);
            const { error } = await kickMember(id, targetUserId);
            if (error) { appAlert('오류', error); return; }
            void insertSystemMessage(id, 'member_kicked', displayName, targetNickname);
          },
        },
      ],
    );
  }

  function handleRefreshCode() {
    if (!id) return;
    appAlert(
      '초대 코드 갱신',
      '기존 코드가 무효화되고 새 코드가 발급됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '갱신',
          onPress: async () => {
            const { newCode, error } = await refreshInviteCode(id);
            if (error) appAlert('오류', error);
            else if (newCode) appAlert('코드 갱신 완료', `새 초대 코드: ${newCode}`);
          },
        },
      ],
    );
  }

  async function handleCreateRoutine() {
    if (!user?.id || !id || !routineName.trim()) return;
    if (routines.length >= 1) {
      appAlert('제한', '1보드 1루틴 원칙에 따라 루틴은 하나만 생성할 수 있어요.');
      return;
    }
    const trimmed = routineName.trim();
    const { error } = await createBoardRoutine(id, user.id, trimmed);
    if (error) { appAlert('오류', error); return; }
    const displayName = getDisplayName(myNickname, user.id);
    void insertSystemMessage(id, 'routine_created', displayName, undefined, trimmed);
    setRoutineName('');
    setShowCreateRoutine(false);
  }

  function handleDeleteRoutine(routineId: string, name: string) {
    if (!id || !isAdmin) return;
    appAlert('루틴 삭제', `"${name}" 루틴을 삭제할까요?\n과거 인증 기록은 유지됩니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteBoardRoutine(id, routineId);
          const displayName = getDisplayName(myNickname, user?.id);
          void insertSystemMessage(id, 'routine_deleted', displayName, undefined, name);
        },
      },
    ]);
  }

  function openVerify(routineId: string) {
    setSelectedRoutineId(routineId);
    setPhotoUri(null);
    setMemo('');
    setShowVerify(true);
  }

  async function handlePickImage() {
    const uri = await pickImage();
    if (uri) setPhotoUri(uri);
  }

  async function handleTakePhoto() {
    const uri = await takePhoto();
    if (uri) setPhotoUri(uri);
  }

  async function handleSubmitVerification() {
    if (!user?.id || !id || !selectedRoutineId || !photoUri) return;
    setSubmitting(true);
    try {
      const { error } = await submitVerification(id, selectedRoutineId, user.id, photoUri, memo || null);
      if (error) {
        appAlert('오류', error);
        return;
      }
      setShowVerify(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteLog(log: BoardVerificationLog) {
    if (!id) return;
    appAlert('인증 삭제', '이 인증 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => void deleteVerification(id, log.id, log.photoPath),
      },
    ]);
  }

  const grassHex = getGrassColor(grassColor);
  const grassOpacity = GRASS_OPACITY;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'members', label: '멤버' },
    { key: 'routines', label: '루틴' },
    { key: 'feed', label: '피드' },
  ];

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.screen }}>
        <PageHeader title={board.name} onBack={() => router.back()} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={handleShareCode} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="초대 코드 공유">
            <AppIcon name="Share2" size={18} color={c.inkTertiary} />
          </Pressable>
          {isAdmin && (
            <Pressable onPress={handleVoteDelete} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="보드 삭제 투표">
              <AppIcon name="Trash2" size={18} color={c.danger} />
            </Pressable>
          )}
          <Pressable onPress={handleLeave} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="보드 나가기">
            <AppIcon name="LogOut" size={18} color={c.danger} />
          </Pressable>
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.screen,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderBottomWidth: 2,
              borderBottomColor: tab === t.key ? c.primary : 'transparent',
            }}
          >
            <AppText
              variant="body"
              style={{
                fontWeight: tab === t.key ? '700' : '500',
                color: tab === t.key ? c.primary : c.inkTertiary,
              }}
            >
              {t.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.section }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'members' && (
          <>
            <Card style={{ alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="caption" tone="tertiary">초대 코드</AppText>
              <AppText variant="title" style={{ fontSize: 24, fontWeight: '700', letterSpacing: 4 }}>
                {board.inviteCode}
              </AppText>
              {isAdmin && (
                <Pressable onPress={handleRefreshCode} hitSlop={8} style={{ padding: 4 }}>
                  <AppText variant="caption" style={{ color: c.primary }}>코드 갱신</AppText>
                </Pressable>
              )}
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
                    paddingVertical: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: c.borderNeutral,
                    gap: spacing.xs,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ flex: 1, minWidth: 60 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <AppText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                          {member.nickname}
                        </AppText>
                        {member.role === 'admin' && (
                          <AppIcon name="Crown" size={12} color={c.accent} />
                        )}
                      </View>
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
                  </View>
                  {isAdmin && member.userId !== user?.id && member.role !== 'admin' && (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingLeft: 4 }}>
                      <Pressable
                        onPress={() => handleDelegateAdmin(member.userId, member.nickname)}
                        hitSlop={4}
                        style={{ padding: 2 }}
                      >
                        <AppText variant="caption" style={{ color: c.primary, fontSize: 11 }}>관리자 위임</AppText>
                      </Pressable>
                      <Pressable
                        onPress={() => handleKickMember(member.userId, member.nickname)}
                        hitSlop={4}
                        style={{ padding: 2 }}
                      >
                        <AppText variant="caption" style={{ color: c.danger, fontSize: 11 }}>추방</AppText>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'routines' && (
          <View style={{ gap: spacing.md }}>
            {isAdmin && routines.length === 0 && (
              <Pressable
                onPress={() => setShowCreateRoutine(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.item,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: c.primary,
                  borderStyle: 'dashed',
                }}
              >
                <AppIcon name="Plus" size={16} color={c.primary} />
                <AppText variant="body" style={{ color: c.primary, fontWeight: '600' }}>
                  공동 루틴 추가
                </AppText>
              </Pressable>
            )}

            {routines.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: spacing.sm }}>
                <AppIcon name="RotateCcw" size={32} color={c.inkDisabled} />
                <AppText variant="body" tone="tertiary">
                  {isAdmin ? '루틴을 설정해주세요.' : '아직 공동 루틴이 없어요.'}
                </AppText>
              </View>
            ) : (
              routines.map((routine) => {
                const verified = user?.id ? hasVerified(user.id, routine.id, todayStr) : false;
                return (
                  <Card key={routine.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.gap }}>
                      <AppIcon name={verified ? 'CheckCircle' : 'RotateCcw'} size={16} color={verified ? c.accent : c.primary} />
                      <AppText variant="body" style={{ flex: 1, fontWeight: '600' }}>
                        {routine.name}
                      </AppText>
                      {verified ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: radius.sm,
                            backgroundColor: c.surfaceMuted,
                          }}
                        >
                          <AppIcon name="Check" size={12} color={c.primary} />
                          <AppText variant="caption" style={{ color: c.primary, fontWeight: '700' }}>
                            완료
                          </AppText>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => openVerify(routine.id)}
                          hitSlop={8}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: radius.sm,
                            backgroundColor: c.primary,
                          }}
                        >
                          <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                            인증
                          </AppText>
                        </Pressable>
                      )}
                      {isAdmin && (
                        <Pressable
                          onPress={() => handleDeleteRoutine(routine.id, routine.name)}
                          hitSlop={8}
                          style={{ padding: 4 }}
                        >
                          <AppIcon name="Trash2" size={14} color={c.danger} />
                        </Pressable>
                      )}
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {tab === 'feed' && (
          <FeedTab
            logs={logs}
            systemMessages={systemMessages}
            user={user}
            memberNicknames={memberNicknames}
            onDeleteLog={handleDeleteLog}
            c={c}
          />
        )}
      </ScrollView>

      {/* Create Routine Modal */}
      <SheetModal
        visible={showCreateRoutine}
        onClose={() => setShowCreateRoutine(false)}
        title="공동 루틴 추가"
        footer={
          <SheetPrimaryButton
            label="추가"
            onPress={() => void handleCreateRoutine()}
            disabled={!routineName.trim()}
          />
        }
      >
        <View style={{ gap: spacing.md }}>
          <AppText variant="caption" tone="tertiary">
            보드 멤버 모두가 함께하는 루틴을 만들어요.
          </AppText>
          <TextInput
            value={routineName}
            onChangeText={setRoutineName}
            placeholder="루틴 이름 (예: 운동 인증)"
            placeholderTextColor={c.inkDisabled}
            maxLength={30}
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: radius.md,
              padding: spacing.item,
              color: c.ink,
              fontSize: 15,
            }}
            autoFocus
          />
        </View>
      </SheetModal>

      {/* Verification Modal */}
      <SheetModal
        visible={showVerify}
        onClose={() => setShowVerify(false)}
        title="인증하기"
        footer={
          <SheetPrimaryButton
            label={submitting ? '업로드 중...' : '인증 완료'}
            onPress={() => void handleSubmitVerification()}
            disabled={!photoUri || submitting}
          />
        }
      >
        <View style={{ gap: spacing.md }}>
          {photoUri ? (
            <View>
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: radius.md,
                  backgroundColor: c.surfaceMuted,
                }}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setPhotoUri(null)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 12,
                  padding: 4,
                }}
              >
                <AppIcon name="X" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Pressable
                onPress={() => void handleTakePhoto()}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: 32,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderStyle: 'dashed',
                }}
              >
                <AppIcon name="Camera" size={24} color={c.inkTertiary} />
                <AppText variant="caption" tone="tertiary">촬영</AppText>
              </Pressable>
              <Pressable
                onPress={() => void handlePickImage()}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: 32,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderStyle: 'dashed',
                }}
              >
                <AppIcon name="ImageIcon" size={24} color={c.inkTertiary} />
                <AppText variant="caption" tone="tertiary">앨범</AppText>
              </Pressable>
            </View>
          )}

          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="한줄 메모 (선택)"
            placeholderTextColor={c.inkDisabled}
            maxLength={100}
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: radius.md,
              padding: spacing.item,
              color: c.ink,
              fontSize: 15,
            }}
          />

          {submitting && (
            <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <ActivityIndicator color={c.primary} />
            </View>
          )}
        </View>
      </SheetModal>
    </SafeAreaView>
  );
}
