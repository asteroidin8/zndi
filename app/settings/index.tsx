import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  SettingAccountSection,
  SettingChoiceRow,
  SettingDestructiveRow,
  SettingRow,
  SettingSection,
  SettingToggleRow,
  SettingsScaffold,
} from '@/components/settings';
import { NOTIFICATION_COPY } from '@/constants/settingsOptions';
import type { ThemeMode } from '@/stores/useSettingsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { requestNotificationPermission } from '@/utils/notificationPermission';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';
import type { SegmentOption } from '@/components/settings/SettingSegmentTrack';

const THEME_SEGMENTS: SegmentOption<string>[] = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

export default function SettingsIndexScreen() {
  const {
    themeMode,
    setThemeMode,
    foregroundServiceEnabled,
    toggleForegroundService,
    routineNotificationsEnabled,
    setRoutineNotifications,
    todoNotificationsEnabled,
    setTodoNotifications,
  } = useSettingsStore();

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const copy = NOTIFICATION_COPY;

  async function handleRoutineNotifications(enabled: boolean) {
    if (enabled && !(await requestNotificationPermission())) return;
    setRoutineNotifications(enabled);
  }

  async function handleTodoNotifications(enabled: boolean) {
    if (enabled && !(await requestNotificationPermission())) return;
    setTodoNotifications(enabled);
  }

  async function handleForegroundServiceToggle() {
    if (!foregroundServiceEnabled && !(await requestNotificationPermission())) return;
    toggleForegroundService();
  }

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
              themeMode: 'dark',
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
    <SettingsScaffold title="설정" showBackButton={false}>
      <SettingAccountSection />

      <SettingSection title="환경">
        <SettingChoiceRow
          label="테마"
          options={THEME_SEGMENTS}
          value={themeMode}
          onChange={(v) => setThemeMode((v ?? 'dark') as ThemeMode)}
        />
        <SettingToggleRow
          label={copy.fastingBar.label}
          description={copy.fastingBar.description}
          value={foregroundServiceEnabled}
          onToggle={() => {
            handleForegroundServiceToggle();
          }}
        />
        <SettingToggleRow
          label={copy.routine.label}
          description={copy.routine.description}
          value={routineNotificationsEnabled}
          onToggle={handleRoutineNotifications}
        />
        <SettingToggleRow
          label={copy.todo.label}
          description={copy.todo.description}
          value={todoNotificationsEnabled}
          onToggle={handleTodoNotifications}
        />
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
        <SettingRow label="버전" value={`v${version}`} showChevron={false} />
      </SettingSection>

      <SettingSection title="">
        <SettingDestructiveRow label="데이터 초기화" onPress={handleDataReset} />
      </SettingSection>
    </SettingsScaffold>
  );
}
