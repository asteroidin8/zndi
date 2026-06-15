import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';

import { AppText } from '../AppText';
import { SettingDestructiveRow } from './SettingDestructiveRow';
import { SettingRow } from './SettingRow';
import { SettingSection } from './SettingSection';
import { settingCardBlockStyle } from './settingStyles';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/stores/useUserStore';
import { pullCloudToLocal } from '@/services/sync/cloudSync';
import { getProfileRowValue } from '@/utils/profileSummary';

export function SettingAccountSection() {
  const c = useThemeColors();
  const { profile } = useUserStore();
  const { configured, loading, user, signInGoogle, sendEmailOtp, verifyEmailOtp, signOut } =
    useAuth();
  const [busy, setBusy] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const profileRow = getProfileRowValue(profile);

  if (!configured) {
    return (
      <SettingSection title="계정">
        <View style={settingCardBlockStyle()}>
          <AppText variant="caption" tone="tertiary" style={{ fontSize: 13 }}>
            Supabase 환경 변수가 없어요. .env에 URL과 anon key를 설정해 주세요.
          </AppText>
        </View>
      </SettingSection>
    );
  }

  if (loading) {
    return (
      <SettingSection title="계정">
        <View style={settingCardBlockStyle({ centered: true })}>
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

  async function handlePull() {
    if (!user) return;
    Alert.alert(
      '클라우드 데이터로 덮어쓰기',
      '이 기기의 로컬 데이터가 클라우드 내용으로 교체됩니다. 최근 이 기기에서만 수정한 내용은 사라질 수 있어요. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '덮어쓰기',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const result = await pullCloudToLocal(user.id);
            setBusy(false);
            Alert.alert(
              result.error ? '복원 실패' : '복원 완료',
              result.error ?? '클라우드 데이터를 불러왔어요.',
            );
          },
        },
      ],
    );
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: c.borderNeutral,
    borderRadius: 10,
    padding: 12,
    color: c.ink,
  } as const;

  return (
    <SettingSection title="계정">
      {!user && (
        <View style={settingCardBlockStyle()}>
          <Pressable
            onPress={handleGoogle}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Google로 로그인"
            style={{
              backgroundColor: c.primary,
              borderRadius: 12,
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
            <Pressable
              onPress={() => setEmailMode(true)}
              accessibilityRole="button"
              style={{ alignItems: 'center', paddingVertical: spacing.xs }}
            >
              <AppText variant="caption" tone="tertiary" style={{ fontSize: 13 }}>
                이메일로 로그인
              </AppText>
            </Pressable>
          ) : (
            <View style={{ gap: spacing.sm, width: '100%' }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={inputStyle}
                placeholderTextColor={c.inkTertiary}
              />
              {otpSent && (
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="인증 코드 6자리"
                  keyboardType="number-pad"
                  style={inputStyle}
                  placeholderTextColor={c.inkTertiary}
                />
              )}
              <Pressable
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                disabled={busy}
                style={{
                  backgroundColor: c.surfaceMuted,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <AppText variant="body" style={{ fontWeight: '600' }}>
                  {otpSent ? '인증하기' : '인증 코드 받기'}
                </AppText>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {user && (
        <>
          <SettingRow label="로그인 계정" value={user.email ?? 'Google'} showChevron={false} />
          <SettingRow label="클라우드 데이터로 덮어쓰기" onPress={handlePull} />
        </>
      )}

      <SettingRow
        label="프로필"
        value={profileRow.value}
        unset={profileRow.unset}
        onPress={() => router.push('/settings/profile')}
      />

      {user && <SettingDestructiveRow label="로그아웃" onPress={handleLogout} />}
    </SettingSection>
  );
}
