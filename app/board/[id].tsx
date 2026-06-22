import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getGrassColor, getCellBorderRadius } from '@/constants/grassTheme';
import { radius, spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  EMPTY_BOARD_LOGS,
  EMPTY_BOARD_MEMBERS,
  EMPTY_BOARD_PROGRESS,
  EMPTY_BOARD_ROUTINES,
  useBoardStore,
} from '@/stores/useBoardStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { leaveBoard } from '@/services/board/boardService';
import {
  createBoardRoutine,
  deleteBoardRoutine,
  fetchBoardRoutines,
  fetchVerificationLogs,
  pickImage,
  submitVerification,
  takePhoto,
  deleteVerification,
} from '@/services/board/boardRoutineService';
import type { BoardVerificationLog } from '@/types';
import { localDateStr } from '@/utils/dateFormat';

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];
type Tab = 'members' | 'routines' | 'feed';

function getWeekDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(localDateStr(d));
  }
  return dates;
}

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

export default function BoardDetailScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const board = useBoardStore((s) => s.boards.find((b) => b.id === id));
  const members = useBoardStore((s) => s.members[id ?? ''] ?? EMPTY_BOARD_MEMBERS);
  const progress = useBoardStore((s) => s.progress[id ?? ''] ?? EMPTY_BOARD_PROGRESS);
  const routines = useBoardStore((s) => s.routines[id ?? ''] ?? EMPTY_BOARD_ROUTINES);
  const logs = useBoardStore((s) => s.logs[id ?? ''] ?? EMPTY_BOARD_LOGS);

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

  useEffect(() => {
    if (!id) return;
    void fetchBoardRoutines(id);
    void fetchVerificationLogs(id);
  }, [id]);

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

  async function handleCreateRoutine() {
    if (!user?.id || !id || !routineName.trim()) return;
    const { error } = await createBoardRoutine(id, user.id, routineName.trim());
    if (error) Alert.alert('오류', error);
    setRoutineName('');
    setShowCreateRoutine(false);
  }

  function handleDeleteRoutine(routineId: string, name: string) {
    if (!id) return;
    Alert.alert('루틴 삭제', `"${name}" 루틴을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => void deleteBoardRoutine(id, routineId),
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
    const { error } = await submitVerification(id, selectedRoutineId, user.id, photoUri, memo || null);
    setSubmitting(false);
    if (error) {
      Alert.alert('오류', error);
      return;
    }
    setShowVerify(false);
  }

  function handleDeleteLog(log: BoardVerificationLog) {
    if (!id) return;
    Alert.alert('인증 삭제', '이 인증 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => void deleteVerification(id, log.id, log.photoPath),
      },
    ]);
  }

  const grassHex = getGrassColor(grassColor);
  const grassOpacity = [0, 0.2, 0.4, 0.65, 1];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'members', label: '멤버' },
    { key: 'routines', label: '루틴' },
    { key: 'feed', label: '피드' },
  ];

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
              ))}
            </View>
          </>
        )}

        {tab === 'routines' && (
          <View style={{ gap: spacing.md }}>
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

            {routines.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: spacing.sm }}>
                <AppIcon name="RotateCcw" size={32} color={c.inkDisabled} />
                <AppText variant="body" tone="tertiary">
                  아직 공동 루틴이 없어요.
                </AppText>
              </View>
            ) : (
              routines.map((routine) => (
                <Card key={routine.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.gap }}>
                    <AppIcon name="RotateCcw" size={16} color={c.primary} />
                    <AppText variant="body" style={{ flex: 1, fontWeight: '600' }}>
                      {routine.name}
                    </AppText>
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
                    {(routine.createdBy === user?.id || isOwner) && (
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
              ))
            )}
          </View>
        )}

        {tab === 'feed' && (
          <View style={{ gap: spacing.md }}>
            {logs.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: spacing.sm }}>
                <AppIcon name="Camera" size={32} color={c.inkDisabled} />
                <AppText variant="body" tone="tertiary">
                  아직 인증 기록이 없어요.
                </AppText>
              </View>
            ) : (
              logs.map((log) => (
                <Card key={log.id}>
                  <View style={{ gap: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: c.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppText variant="caption" style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                          {(log.nickname ?? '?')[0]}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" style={{ fontWeight: '600' }}>
                          {log.nickname ?? '멤버'}
                        </AppText>
                        <AppText variant="caption" tone="tertiary">
                          {log.routineName ?? '루틴'} · {formatLogTime(log.createdAt)}
                        </AppText>
                      </View>
                      {log.userId === user?.id && (
                        <Pressable onPress={() => handleDeleteLog(log)} hitSlop={8} style={{ padding: 4 }}>
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
              ))
            )}
          </View>
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
