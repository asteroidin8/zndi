import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Alert, Linking, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { AppText } from '@/components/AppText';
import {
  SettingAccountSection,
  SettingDestructiveRow,
  SettingRow,
  SettingSection,
  SettingsScaffold,
} from '@/components/settings';
import { THEME_LABELS } from '@/constants/settingsOptions';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';

export default function SettingsIndexScreen() {
  const { themeMode } = useSettingsStore();

  function handleDataReset() {
    Alert.alert(
      '데이터 초기화',
      '단식·루틴·할 일 기록과 프로필, 앱 설정이 모두 삭제됩니다.\n이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
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
            useTodoStore.setState({ todos: [], lastArchiveDate: null });
            useRoutineCompletionStore.setState({ completions: {} });
            useUserStore.setState({
              profile: {
                heightCm: null,
                weightKg: null,
                targetWeightKg: null,
                ageYears: null,
                isMale: null,
              },
            });
            useSettingsStore.setState({
              foregroundServiceEnabled: true,
              themeMode: 'system',
              routineNotificationsEnabled: false,
              todoNotificationsEnabled: false,
              onboardingCompleted: false,
              seenHints: {},
            });
          },
        },
      ],
    );
  }

  return (
    <SettingsScaffold title="설정" closeIcon="X">
      <SettingAccountSection />

      <SettingSection title="환경">
        <SettingRow
          label="테마"
          value={THEME_LABELS[themeMode]}
          onPress={() => router.push('/settings/theme')}
        />
        <SettingRow label="알림" onPress={() => router.push('/settings/notifications')} />
      </SettingSection>

      <SettingSection title="데이터">
        <SettingDestructiveRow label="데이터 초기화" onPress={handleDataReset} />
      </SettingSection>

      <SettingSection title="정보">
        <SettingRow label="이용약관" onPress={() => router.push('/terms')} />
        <SettingRow label="개인정보처리방침" onPress={() => router.push('/privacy')} />
        <SettingRow
          label="문의하기"
          onPress={() =>
            Linking.openURL('mailto:asteroidin8@gmail.com?subject=%EC%9E%94%EB%94%94%20%EB%AC%B8%EC%9D%98')
          }
        />
      </SettingSection>

      <View style={{ alignItems: 'center', paddingTop: 8 }}>
        <AppText variant="caption" tone="tertiary" style={{ fontSize: 12 }}>
          v{Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
      </View>
    </SettingsScaffold>
  );
}
