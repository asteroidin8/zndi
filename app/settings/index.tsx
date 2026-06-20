import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { DangerRow, GroupCard, InsetDivider, Row } from '@/components/settings/MyScreenUI';
import { radius, spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeMode } from '@/stores/useSettingsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';
import { getGrassLevel } from '@/utils/grassLevel';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

export default function MyScreen() {
  const c = useThemeColors();
  const { themeMode, setThemeMode } = useSettingsStore();
  const { configured, loading, user, signInGoogle, sendEmailOtp, verifyEmailOtp, signOut } = useAuth();
  const { profile, setNickname } = useUserStore();
  const { routines } = useRoutineStore();
  const { isCompleted, completions } = useRoutineCompletionStore();
  const streak = getRoutineStreakDays(routines, isCompleted);
  const totalGrass = Object.keys(completions).length;
  const grassLevel = getGrassLevel(totalGrass);

  const [busy, setBusy] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profile.nickname ?? '');
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await signInGoogle();
      if (result.cancelled) return;
      if (result.error) Alert.alert('로그인 실패', result.error);
    } catch {
      Alert.alert('로그인 실패', '로그인 중 오류가 발생했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp() {
    if (!email.trim()) return;
    setBusy(true);
    const result = await sendEmailOtp(email);
    setBusy(false);
    if (result.error) Alert.alert('이메일 전송 실패', result.error);
    else setOtpSent(true);
  }

  async function handleVerifyOtp() {
    setBusy(true);
    const result = await verifyEmailOtp(email, otp);
    setBusy(false);
    if (result.error) Alert.alert('인증 실패', result.error);
    else { setEmailMode(false); setOtpSent(false); setOtp(''); }
  }

  function handleLogout() {
    Alert.alert('로그아웃', '계정에서 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => {
        const result = await signOut();
        if (result.error) Alert.alert('로그아웃 실패', result.error);
      }},
    ]);
  }

  function handleDataReset() {
    Alert.alert(
      '데이터 초기화',
      '단식·루틴·할 일 기록과 프로필, 앱 설정이 모두 삭제됩니다.\n이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '초기화', style: 'destructive', onPress: async () => {
          await Promise.all([
            useFastingStore.persist.clearStorage(),
            useRoutineStore.persist.clearStorage(),
            useTodoStore.persist.clearStorage(),
            useUserStore.persist.clearStorage(),
            useSettingsStore.persist.clearStorage(),
            useRoutineCompletionStore.persist.clearStorage(),
          ]);
          await cancelNotificationsByPrefix(NOTIFICATION_ID.routinePrefix);
          await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);
          await Notifications.dismissNotificationAsync(NOTIFICATION_ID.fasting).catch(() => {});
          useFastingStore.setState({ status: 'idle', startedAt: null, records: [], goalHours: 16 });
          useRoutineStore.setState({ routines: [] });
          useTodoStore.setState({ todos: [], groups: [], lastArchiveDate: null });
          useRoutineCompletionStore.setState({ completions: {} });
          useUserStore.setState({
            profile: { heightCm: null, weightKg: null, targetWeightKg: null, ageYears: null, isMale: null, nickname: null },
          });
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
            {editingNickname ? (
              <TextInput
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="닉네임 입력"
                placeholderTextColor={c.inkDisabled}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => { setNickname(nicknameInput.trim() || null); setEditingNickname(false); }}
                onBlur={() => { setNickname(nicknameInput.trim() || null); setEditingNickname(false); }}
                style={{
                  fontSize: 20, fontWeight: '700', color: c.ink,
                  textAlign: 'center', minWidth: 120,
                  borderBottomWidth: 1, borderBottomColor: c.primary,
                  paddingVertical: spacing.xs,
                }}
              />
            ) : (
              <Pressable onPress={() => { setNicknameInput(profile.nickname ?? ''); setEditingNickname(true); }}>
                <AppText variant="title" style={{ fontWeight: '700' }}>
                  {profile.nickname || (user.email ?? 'Google 계정')}
                </AppText>
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
                <View style={{ width: '100%', height: 4, backgroundColor: c.surfaceMuted, borderRadius: 2, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: 4,
                      width: `${Math.min(((totalGrass - grassLevel.min) / (grassLevel.max - grassLevel.min)) * 100, 100)}%`,
                      backgroundColor: c.primary,
                      borderRadius: 2,
                    }}
                  />
                </View>
                <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>
                  다음 레벨까지 {grassLevel.max - totalGrass + 1}잔디
                </AppText>
              </View>
            )}
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
          <Row label="알림" icon="Bell" onPress={() => router.push('/settings/notifications')} />
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
        </GroupCard>
      </ScrollView>
    </SafeAreaView>
  );
}
