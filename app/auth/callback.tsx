import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useURL } from 'expo-linking';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { handleAuthCallbackUrl } from '@/services/auth/authSession';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const linkUrl = useURL();
  const c = useThemeColors();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    let cancelled = false;

    async function finish(callbackUrl: string | null) {
      if (!callbackUrl?.includes('auth/callback')) {
        router.replace('/settings');
        return;
      }

      handled.current = true;
      const result = await handleAuthCallbackUrl(callbackUrl);
      if (cancelled) return;

      if (result.error) {
        Alert.alert('로그인 실패', result.error, [{ text: '확인', onPress: () => router.replace('/settings') }]);
        return;
      }
      router.replace('/settings');
    }

    Linking.getInitialURL()
      .then((initial) => finish(initial ?? linkUrl))
      .catch(() => finish(linkUrl));

    return () => {
      cancelled = true;
    };
  }, [linkUrl, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: c.surface,
        padding: spacing.screen,
      }}
    >
      <ActivityIndicator size="large" color={c.ink} />
      <AppText variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
        로그인 처리 중…
      </AppText>
    </View>
  );
}
