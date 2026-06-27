import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  InteractionManager,
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
import { MembersTab } from '@/components/board/MembersTab';
import { Card } from '@/components/Card';
import { QRModal } from '@/components/QRModal';
import { SheetModal, SheetPrimaryButton } from '@/components/SheetModal';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { APP_SCHEME } from '@/constants/app';
import { radius, spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert } from '@/stores/useAlertStore';
import { toast } from '@/stores/useToastStore';
import { feedbackVote, feedbackRefresh, feedbackSave, feedbackError } from '@/utils/microFeedback';
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
  fetchMyDeleteVote,
  insertSystemMessage,
  kickMember,
  leaveBoard,
  refreshInviteCode,
  unvoteDeleteBoard,
  voteDeleteBoard,
} from '@/services/board/boardService';
import { sendBoardPush } from '@/services/board/boardPushService';
import {
  createBoardRoutine,
  deleteBoardRoutine,
  fetchBoardRoutines,
  fetchMoreVerificationLogs,
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

type Tab = 'members' | 'feed';

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
  onLoadMore,
  c,
}: {
  logs: BoardVerificationLog[];
  systemMessages: BoardSystemMessage[];
  user: { id: string } | null | undefined;
  memberNicknames: Map<string, string>;
  onDeleteLog: (log: BoardVerificationLog) => void;
  onLoadMore: () => void;
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
      {logs.length >= 50 && (
        <Pressable
          onPress={onLoadMore}
          style={{ alignItems: 'center', paddingVertical: spacing.md }}
        >
          <AppText variant="caption" tone="primary" style={{ fontWeight: '600' }}>이전 기록 더 보기</AppText>
        </Pressable>
      )}
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
  const [showQR, setShowQR] = useState(false);
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [hasVoted, setHasVoted] = useState(false);

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
    const task = InteractionManager.runAfterInteractions(() => {
      void fetchBoardMembers(id);
      void fetchBoardRoutines(id);
      void fetchVerificationLogs(id);
      void fetchSystemMessages(id);
      void fetchMyDeleteVote(id).then(({ hasVoted: v }) => setHasVoted(v));
    });
    return () => task.cancel();
  }, [id]);

  const todayRoutineTotal = routines.length;

  const verifiedSet = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) {
      set.add(`${l.userId}:${l.routineId}:${localDateStr(new Date(l.createdAt))}`);
    }
    return set;
  }, [logs]);

  function hasVerified(userId: string, routineId: string, date: string): boolean {
    return verifiedSet.has(`${userId}:${routineId}:${date}`);
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
            const store = useBoardStore.getState();
            const cache = {
              board,
              members: store.members[id] ?? [],
              routines: store.routines[id] ?? [],
              logs: store.logs[id] ?? [],
              progress: store.progress[id] ?? [],
              cachedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(`board-cache:${id}`, JSON.stringify(cache)).catch(() => {});
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
            if (error) { feedbackError(); toast(error, 'error'); return; }
            if (deleted) {
              router.back();
            } else {
              setHasVoted(true);
              feedbackVote();
              toast(`투표 완료 · ${votes}/${total}명 동의`);
              void sendBoardPush(
                id,
                '보드 삭제 투표',
                `${board!.name} 보드 삭제 투표가 진행 중입니다. (${votes}/${total})`,
                user?.id,
              );
            }
          },
        },
      ],
    );
  }

  function handleUnvoteDelete() {
    if (!id) return;
    appAlert(
      '투표 철회',
      '보드 삭제 동의를 철회할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '철회',
          onPress: async () => {
            const { error } = await unvoteDeleteBoard(id);
            if (error) { toast(error, 'error'); return; }
            setHasVoted(false);
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
            if (error) { toast(error, 'error'); return; }
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
            if (error) { toast(error, 'error'); return; }
            void insertSystemMessage(id, 'member_kicked', displayName, targetNickname);
            void sendBoardPush(
              id,
              '보드 알림',
              `${board!.name} 보드에서 추방되었습니다.`,
              user?.id,
            );
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
            if (error) { feedbackError(); toast(error, 'error'); }
            else if (newCode) { feedbackRefresh(); toast('초대 코드가 갱신되었어요'); }
          },
        },
      ],
    );
  }

  async function handleCreateRoutine() {
    if (!user?.id || !id || !routineName.trim()) return;
    if (routines.length >= 1) {
      toast('1보드 1루틴 원칙에 따라 루틴은 하나만 생성할 수 있어요', 'error');
      return;
    }
    const trimmed = routineName.trim();
    const { error } = await createBoardRoutine(id, user.id, trimmed);
    if (error) { toast(error, 'error'); return; }
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
        feedbackError();
        toast(error, 'error');
        return;
      }
      feedbackSave();
      toast('인증 완료!');
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

  function handleLoadMoreLogs() {
    if (!id || logs.length === 0) return;
    const oldest = logs[logs.length - 1].createdAt;
    void fetchMoreVerificationLogs(id, oldest);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'members', label: '멤버' },
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
          {hasVoted ? (
            <Pressable onPress={handleUnvoteDelete} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="삭제 투표 철회">
              <AppIcon name="Undo2" size={18} color={c.warning} />
            </Pressable>
          ) : (
            <Pressable onPress={handleVoteDelete} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="보드 삭제 투표">
              <AppIcon name="ThumbsDown" size={18} color={c.danger} />
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
          <MembersTab
            inviteCode={board.inviteCode}
            isAdmin={isAdmin}
            weekDates={weekDates}
            memberStats={memberStats}
            grassColor={grassColor}
            grassCellShape={grassCellShape}
            currentUserId={user?.id}
            routines={routines}
            hasVerified={(routineId) => user?.id ? hasVerified(user.id, routineId, todayStr) : false}
            onRefreshCode={handleRefreshCode}
            onDelegateAdmin={handleDelegateAdmin}
            onKickMember={handleKickMember}
            onOpenCreateRoutine={() => setShowCreateRoutine(true)}
            onDeleteRoutine={handleDeleteRoutine}
            onVerify={openVerify}
            onShowQR={() => setShowQR(true)}
          />
        )}

        {tab === 'feed' && (
          <FeedTab
            logs={logs}
            systemMessages={systemMessages}
            user={user}
            memberNicknames={memberNicknames}
            onDeleteLog={handleDeleteLog}
            onLoadMore={handleLoadMoreLogs}
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

      <QRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        title="보드 초대"
        subtitle="QR 코드를 스캔하거나 초대 코드를 공유하세요"
        value={`${APP_SCHEME}://board/join?code=${board.inviteCode}`}
        copyLabel={board.inviteCode}
      />
    </SafeAreaView>
  );
}
