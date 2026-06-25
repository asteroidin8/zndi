import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { QRModal } from '@/components/QRModal';
import { DangerRow, GroupCard, InsetDivider, Row } from '@/components/settings/MyScreenUI';
import { radius, spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert } from '@/stores/useAlertStore';
import { useAvatarStore } from '@/stores/useAvatarStore';
import { useProStore } from '@/stores/useProStore';
import { getAvatarById } from '@/constants/avatars';
import { getAvatarColor, getDisplayName, getInitial } from '@/utils/avatarColor';
import type { ThemeMode, TimeFormat } from '@/stores/useSettingsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useUserStore } from '@/stores/useUserStore';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';
import { getGrassLevel } from '@/utils/grassLevel';
import { deleteAccount } from '@/services/auth/authSession';
import { resetUserData } from '@/utils/resetUserData';
import { checkNicknameTaken } from '@/services/sync/cloudSync';
import { updateMyNicknameInBoards } from '@/services/board/boardService';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: '24h', label: '24시간' },
  { value: '12h', label: '오전/오후' },
];

export default function MyScreen() {
  const c = useThemeColors();
  const { themeMode, setThemeMode, timeFormat, setTimeFormat } = useSettingsStore();
  const { isPro } = useProStore();
  const equippedId = useAvatarStore((s) => s.equippedId);
  const equippedAvatar = equippedId ? getAvatarById(equippedId) : undefined;
  const { configured, loading, user, signInGoogle, sendEmailOtp, verifyEmailOtp, signOut } = useAuth();
  const { profile, setNickname } = useUserStore();
  const allRoutines = useRoutineStore((s) => s.routines);
  const routines = allRoutines.filter((r) => !r.deletedAt);
  const { isCompleted, completions } = useRoutineCompletionStore();
  const streak = getRoutineStreakDays(routines, isCompleted);
  const totalGrass = Object.keys(completions).length;
  const grassLevel = getGrassLevel(totalGrass);

  const [busy, setBusy] = useState(false);
  const [showProfileQR, setShowProfileQR] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profile.nickname ?? '');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  async function handleNicknameSave() {
    const trimmed = nicknameInput.trim() || null;
    setNicknameError(null);
    if (trimmed && user?.id) {
      const taken = await checkNicknameTaken(trimmed, user.id);
      if (taken) {
        setNicknameError('이미 사용 중인 닉네임이에요');
        return;
      }
    }
    setNickname(trimmed);
    setEditingNickname(false);
    if (trimmed && user?.id) {
      void updateMyNicknameInBoards(user.id, trimmed);
    }
  }
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await signInGoogle();
      if (result.cancelled) return;
      if (result.error) appAlert('로그인 실패', result.error);
    } catch {
      appAlert('로그인 실패', '로그인 중 오류가 발생했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp() {
    if (!email.trim()) return;
    setBusy(true);
    const result = await sendEmailOtp(email);
    setBusy(false);
    if (result.error) appAlert('이메일 전송 실패', result.error);
    else setOtpSent(true);
  }

  async function handleVerifyOtp() {
    setBusy(true);
    const result = await verifyEmailOtp(email, otp);
    setBusy(false);
    if (result.error) appAlert('인증 실패', result.error);
    else { setEmailMode(false); setOtpSent(false); setOtp(''); }
  }

  function handleLogout() {
    appAlert('로그아웃', '계정에서 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => {
        const result = await signOut();
        if (result.error) {
          appAlert('로그아웃 실패', result.error);
          return;
        }
        useSettingsStore.setState({
          grassColor: 'green',
          grassShape: 'default',
          grassAnimation: 'none',
        });
        useProStore.setState({
          isPro: false,
          purchasedColors: [],
          purchasedShapes: [],
          purchasedAnimations: [],
        });
      }},
    ]);
  }

  function handleDeleteAccount() {
    appAlert(
      '회원 탈퇴',
      '계정과 모든 데이터가 영구적으로 삭제됩니다.\n클라우드에 저장된 데이터도 함께 삭제돼요.\n이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴', style: 'destructive', onPress: async () => {
          const result = await deleteAccount();
          if (result.error) {
            appAlert('탈퇴 실패', result.error);
            return;
          }
          await resetUserData();
          await cancelNotificationsByPrefix(NOTIFICATION_ID.routinePrefix);
          await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);
          await Notifications.dismissNotificationAsync(NOTIFICATION_ID.fasting).catch(() => {});
          await useSettingsStore.persist.clearStorage();
          useSettingsStore.setState({
            foregroundServiceEnabled: true, themeMode: 'dark',
            routineNotificationsEnabled: false, todoNotificationsEnabled: false,
            onboardingCompleted: false, seenHints: {},
          });
        }},
      ],
    );
  }

  function handleDataReset() {
    appAlert(
      '데이터 초기화',
      '단식·루틴·할 일 기록과 프로필, 앱 설정이 모두 삭제됩니다.\n이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: async () => {
          await resetUserData();
          await cancelNotificationsByPrefix(NOTIFICATION_ID.routinePrefix);
          await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);
          await Notifications.dismissNotificationAsync(NOTIFICATION_ID.fasting).catch(() => {});
          await useSettingsStore.persist.clearStorage();
          useSettingsStore.setState({
            foregroundServiceEnabled: true, themeMode: 'dark',
            routineNotificationsEnabled: false, todoNotificationsEnabled: false,
            onboardingCompleted: false, seenHints: {},
          });
        }},
      ],
    );
  }

  const inputStyle = {
    borderWidth: 1, borderColor: c.borderNeutral, borderRadius: radius.md,
    padding: spacing.md, color: c.ink, fontSize: 15,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.screen, paddingTop: spacing.item }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
          <AppIcon name="X" size={20} color={c.ink} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.section, gap: spacing.section }}>
        {/* ── 프로필 Hero ── */}
        {configured && !loading && user ? (
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Pressable
              onPress={() => router.push('/settings/avatar-collection')}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: equippedAvatar ? equippedAvatar.bgColor : getAvatarColor(user.id),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {equippedAvatar ? (
                <AppText style={{ fontSize: 30 }}>{equippedAvatar.emoji}</AppText>
              ) : (
                <AppText variant="title" style={{ color: '#fff', fontWeight: '700' }}>
                  {getInitial(getDisplayName(profile.nickname, user.id))}
                </AppText>
              )}
            </Pressable>
            {editingNickname ? (
              <View style={{ alignItems: 'center', gap: spacing.xs }}>
                <TextInput
                  value={nicknameInput}
                  onChangeText={(t) => { setNicknameInput(t); setNicknameError(null); }}
                  placeholder="닉네임 입력"
                  placeholderTextColor={c.inkDisabled}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleNicknameSave}
                  style={{
                    fontSize: 20, fontWeight: '700', color: c.ink,
                    textAlign: 'center', minWidth: 120,
                    borderBottomWidth: 1, borderBottomColor: nicknameError ? c.danger : c.primary,
                    paddingVertical: spacing.xs,
                  }}
                />
                {nicknameError && (
                  <AppText variant="caption" style={{ color: c.danger }}>{nicknameError}</AppText>
                )}
              </View>
            ) : (
              <Pressable
                onPress={() => { setNicknameInput(profile.nickname ?? ''); setEditingNickname(true); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
              >
                <AppText variant="title" style={{ fontWeight: '700' }}>
                  {profile.nickname || (user.email ?? 'Google 계정')}
                </AppText>
                <AppIcon name="Pencil" size={14} color={c.inkTertiary} />
              </Pressable>
            )}
            {!profile.nickname && !editingNickname && (
              <Pressable onPress={() => { setNicknameInput(''); setEditingNickname(true); }}>
                <AppText variant="caption" style={{ color: c.primary }}>닉네임을 설정하세요</AppText>
              </Pressable>
            )}
            {profile.nickname && !editingNickname && (
              <AppText variant="caption" tone="tertiary">{user.email}</AppText>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <AppText variant="caption" style={{ fontWeight: '600', color: c.primary }}>
                Lv.{grassLevel.level} {grassLevel.name}
              </AppText>
              {streak > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <AppIcon name="Flame" size={14} color={c.accent} />
                  <AppText variant="caption" style={{ fontWeight: '600', color: c.accent }}>{streak}일</AppText>
                </View>
              )}
              <AppText variant="caption" tone="tertiary">{totalGrass}잔디</AppText>
            </View>

            {grassLevel.max !== null && (
              <View style={{ width: '60%', gap: spacing.xs, alignItems: 'center' }}>
                <ProgressBar value={Math.min(((totalGrass - grassLevel.min) / (grassLevel.max - grassLevel.min)) * 100, 100)} />
                <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>
                  다음 레벨까지 {grassLevel.max - totalGrass + 1}잔디
                </AppText>
              </View>
            )}

            <Pressable
              onPress={() => setShowProfileQR(true)}
              hitSlop={8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: c.surfaceSubtle,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <AppIcon name="QrCode" size={16} color={c.inkTertiary} />
              <AppText variant="caption" tone="tertiary">내 QR 코드</AppText>
            </Pressable>
          </View>
        ) : configured && !loading && !user ? (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="title" style={{ fontWeight: '700' }}>로그인</AppText>
              <AppText variant="caption" tone="tertiary">잔디를 기록하고 동기화해요</AppText>
            </View>
            <Pressable
              onPress={handleGoogle} disabled={busy}
              accessibilityRole="button" accessibilityLabel="Google로 로그인"
              style={{
                backgroundColor: c.primary, borderRadius: radius.md,
                paddingVertical: spacing.md, paddingHorizontal: spacing.section,
                alignItems: 'center', opacity: busy ? 0.6 : 1,
              }}
            >
              <AppText variant="body" style={{ color: c.onPrimary, fontWeight: '700' }}>Google로 로그인</AppText>
            </Pressable>
            {!emailMode ? (
              <Pressable onPress={() => setEmailMode(true)} style={{ alignItems: 'center' }}>
                <AppText variant="caption" tone="tertiary">이메일로 로그인</AppText>
              </Pressable>
            ) : (
              <View style={{ gap: spacing.sm, width: '100%' }}>
                <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com"
                  keyboardType="email-address" autoCapitalize="none" style={inputStyle} placeholderTextColor={c.inkTertiary} />
                {otpSent && (
                  <TextInput value={otp} onChangeText={setOtp} placeholder="인증 코드 6자리"
                    keyboardType="number-pad" style={inputStyle} placeholderTextColor={c.inkTertiary} />
                )}
                <Pressable onPress={otpSent ? handleVerifyOtp : handleSendOtp} disabled={busy}
                  style={{ backgroundColor: c.surfaceMuted, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' }}>
                  <AppText variant="body" style={{ fontWeight: '600' }}>{otpSent ? '인증하기' : '인증 코드 받기'}</AppText>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {/* ── 설정 카드 1 ── */}
        <GroupCard>
          <Row label="신체 정보" icon="User" onPress={() => router.push('/settings/body')} />
          <InsetDivider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: spacing.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <AppIcon name="Moon" size={16} color={c.inkTertiary} />
              <AppText variant="body">테마</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {THEME_OPTIONS.map((opt) => {
                const selected = themeMode === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setThemeMode(opt.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
                      borderRadius: radius.sm,
                      backgroundColor: selected ? c.primary : 'transparent',
                    }}
                  >
                    <AppText variant="caption" style={{
                      fontWeight: selected ? '700' : '400',
                      color: selected ? c.onPrimary : c.inkTertiary,
                    }}>{opt.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <InsetDivider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: spacing.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <AppIcon name="Clock" size={16} color={c.inkTertiary} />
              <AppText variant="body">시간 표기</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {TIME_FORMAT_OPTIONS.map((opt) => {
                const selected = (timeFormat ?? '24h') === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setTimeFormat(opt.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
                      borderRadius: radius.sm,
                      backgroundColor: selected ? c.primary : 'transparent',
                    }}
                  >
                    <AppText variant="caption" style={{
                      fontWeight: selected ? '700' : '400',
                      color: selected ? c.onPrimary : c.inkTertiary,
                    }}>{opt.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <InsetDivider />
          <Row label="알림" icon="Bell" onPress={() => router.push('/settings/notifications')} />
        </GroupCard>

        {/* ── 테마 상점 · 멤버십 ── */}
        <GroupCard>
          <Row label="식물 도감" icon="Leaf" onPress={() => router.push('/settings/avatar-collection')} />
          <InsetDivider />
          <Row label="테마 상점" icon="Palette" onPress={() => router.push('/settings/theme-shop')} />
          <InsetDivider />
          <Row label="멤버십" icon="Crown" value={isPro ? 'Pro' : undefined} onPress={() => router.push('/settings/membership')} />
        </GroupCard>

        {/* ── 설정 카드 2 ── */}
        <GroupCard>
          <Row label="앱 정보" icon="Info" onPress={() => router.push('/settings/about')} />
        </GroupCard>

        {/* ── 위험 카드 ── */}
        <GroupCard>
          {user && (
            <>
              <DangerRow label="로그아웃" onPress={handleLogout} />
              <InsetDivider />
            </>
          )}
          <DangerRow label="데이터 초기화" onPress={handleDataReset} />
          {user && (
            <>
              <InsetDivider />
              <DangerRow label="회원 탈퇴" onPress={handleDeleteAccount} />
            </>
          )}
        </GroupCard>
      </ScrollView>

      {user && (
        <QRModal
          visible={showProfileQR}
          onClose={() => setShowProfileQR(false)}
          title="내 프로필"
          subtitle="친구가 이 QR을 스캔하면 나를 팔로우할 수 있어요"
          value={`zndi://follow?userId=${user.id}`}
          copyLabel={profile.nickname ?? getDisplayName(null, user.id)}
        />
      )}
    </SafeAreaView>
  );
}
