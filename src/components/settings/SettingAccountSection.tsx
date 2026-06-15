import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';

import { AppText } from '../AppText';
import { Card } from '../Card';
import { SettingDestructiveRow } from './SettingDestructiveRow';
import { SettingRow } from './SettingRow';
import { SettingSection } from './SettingSection';
import { SettingToggleRow } from './SettingToggleRow';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { pullCloudToLocal, pushLocalToCloud } from '@/services/sync/cloudSync';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function SettingAccountSection() {
  const c = useThemeColors();
  const { configured, loading, user, signInGoogle, sendEmailOtp, verifyEmailOtp, signOut } =
    useAuth();
  const cloudAutoSyncEnabled = useSettingsStore((s) => s.cloudAutoSyncEnabled);
  const setCloudAutoSyncEnabled = useSettingsStore((s) => s.setCloudAutoSyncEnabled);
  const [busy, setBusy] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  if (!configured) {
    return (
      <SettingSection title="계정 · 클라우드">
        <Card style={{ padding: spacing.card }}>
          <AppText variant="caption" tone="tertiary">
            Supabase 환경 변수가 없어요. .env에 URL과 anon key를 설정해 주세요.
          </AppText>
        </Card>
      </SettingSection>
    );
  }

  if (loading) {
    return (
      <SettingSection title="계정 · 클라우드">
        <View style={{ padding: spacing.card, alignItems: 'center' }}>
          <ActivityIndicator color={c.ink} />
        </View>
      </SettingSection>
    );
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await signInGoogle();
    setBusy(false);
    if (result.cancelled) return;
    if (result.error) Alert.alert('로그인 실패', result.error);
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
    else {
      setEmailMode(false);
      setOtpSent(false);
      setOtp('');
    }
  }

  async function handlePush() {
    if (!user) return;
    setBusy(true);
    const result = await pushLocalToCloud(user.id);
    setBusy(false);
    Alert.alert(result.error ? '백업 실패' : '백업 완료', result.error ?? '로컬 데이터를 클라우드에 저장했어요.');
  }

  async function handlePull() {
    if (!user) return;
    Alert.alert('클라우드에서 복원', '로컬 데이터를 클라우드 내용으로 덮어씁니다. 계속할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '복원',
        onPress: async () => {
          setBusy(true);
          const result = await pullCloudToLocal(user.id);
          setBusy(false);
          Alert.alert(result.error ? '복원 실패' : '복원 완료', result.error ?? '클라우드 데이터를 불러왔어요.');
        },
      },
    ]);
  }

  async function handleLogout() {
    Alert.alert('로그아웃', '계정에서 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const result = await signOut();
          setBusy(false);
          setEmailMode(false);
          setOtpSent(false);
          setEmail('');
          setOtp('');
          if (result.error) Alert.alert('로그아웃 실패', result.error);
        },
      },
    ]);
  }

  if (!user) {
    return (
      <SettingSection
        title="계정 · 클라우드"
        footer="로그인하면 자동 클라우드 동기화(기본 ON)로 다른 기기와 맞출 수 있어요. 오프라인에서도 로컬 저장은 계속됩니다."
      >
        <Pressable
          onPress={handleGoogle}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Google로 로그인"
          style={{
            backgroundColor: c.primary,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <AppText variant="body" style={{ color: c.onPrimary, fontWeight: '700' }}>
            Google로 로그인
          </AppText>
        </Pressable>

        {!emailMode ? (
          <Pressable onPress={() => setEmailMode(true)} accessibilityRole="button">
            <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center', marginTop: spacing.sm }}>
              이메일로 로그인
            </AppText>
          </Pressable>
        ) : (
          <Card style={{ gap: spacing.sm, padding: spacing.card }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 10,
                padding: 12,
                color: c.ink,
              }}
              placeholderTextColor={c.inkTertiary}
            />
            {otpSent && (
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="인증 코드 6자리"
                keyboardType="number-pad"
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 10,
                  padding: 12,
                  color: c.ink,
                }}
                placeholderTextColor={c.inkTertiary}
              />
            )}
            <Pressable
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={busy}
              style={{
                backgroundColor: c.surfaceSubtle,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <AppText variant="body" style={{ fontWeight: '600' }}>
                {otpSent ? '인증하기' : '인증 코드 받기'}
              </AppText>
            </Pressable>
          </Card>
        )}
      </SettingSection>
    );
  }

  return (
    <SettingSection
      title="계정 · 클라우드"
      footer="로컬이 1차 저장소예요. 자동 동기화 ON이면 변경 시 클라우드에 올라가고, 수동 백업·복원도 사용할 수 있어요."
    >
      <SettingRow label="로그인 계정" value={user.email ?? 'Google'} showChevron={false} />
      <SettingToggleRow
        label="자동 클라우드 동기화"
        description="루틴·할일 변경 시 Supabase에 자동 저장"
        value={cloudAutoSyncEnabled}
        onToggle={setCloudAutoSyncEnabled}
      />
      <SettingRow label="클라우드에 백업" onPress={handlePush} />
      <SettingRow label="클라우드에서 복원" onPress={handlePull} />
      <SettingDestructiveRow label="로그아웃" onPress={handleLogout} />
    </SettingSection>
  );
}
