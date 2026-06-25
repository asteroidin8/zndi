import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';

import { GroupCard, InsetDivider, PageHeader, ToggleRow } from '@/components/settings/MyScreenUI';
import { spacing } from '@/constants/spacing';
import { NOTIFICATION_COPY } from '@/constants/settingsOptions';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { requestNotificationPermission } from '@/utils/notificationPermission';

export default function NotificationsScreen() {
  const c = useThemeColors();
  const foregroundServiceEnabled = useSettingsStore((s) => s.foregroundServiceEnabled);
  const routineNotificationsEnabled = useSettingsStore((s) => s.routineNotificationsEnabled);
  const todoNotificationsEnabled = useSettingsStore((s) => s.todoNotificationsEnabled);
  const { toggleForegroundService, setRoutineNotifications, setTodoNotifications } = useSettingsStore.getState();
  const copy = NOTIFICATION_COPY;

  async function handleRoutine(enabled: boolean) { if (enabled && !(await requestNotificationPermission())) return; setRoutineNotifications(enabled); }
  async function handleTodo(enabled: boolean) { if (enabled && !(await requestNotificationPermission())) return; setTodoNotifications(enabled); }
  async function handleForeground() { if (!foregroundServiceEnabled && !(await requestNotificationPermission())) return; toggleForegroundService(); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="알림" onBack={() => router.back()} />

      <View style={{ padding: spacing.screen }}>
        <GroupCard>
          <ToggleRow label={copy.fastingBar.label} description={copy.fastingBar.description} value={foregroundServiceEnabled} onToggle={() => handleForeground()} />
          <InsetDivider />
          <ToggleRow label={copy.routine.label} description={copy.routine.description} value={routineNotificationsEnabled} onToggle={handleRoutine} />
          <InsetDivider />
          <ToggleRow label={copy.todo.label} description={copy.todo.description} value={todoNotificationsEnabled} onToggle={handleTodo} />
        </GroupCard>
      </View>
    </SafeAreaView>
  );
}
