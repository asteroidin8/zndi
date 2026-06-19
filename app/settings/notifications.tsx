import { Pressable, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { spacing } from '@/constants/spacing';
import { NOTIFICATION_COPY } from '@/constants/settingsOptions';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { requestNotificationPermission } from '@/utils/notificationPermission';

function ToggleRow({ label, description, value, onToggle }: {
  label: string; description: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: spacing.screen, paddingVertical: spacing.sm, gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="body">{label}</AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>{description}</AppText>
      </View>
      <Switch value={value} onValueChange={onToggle}
        trackColor={{ false: c.surfaceMuted, true: c.primary }}
        thumbColor={value ? c.onPrimary : c.inkTertiary}
        ios_backgroundColor={c.surfaceMuted} accessibilityLabel={label} />
    </View>
  );
}

function Separator() {
  const c = useThemeColors();
  return <View style={{ height: 1, backgroundColor: c.borderNeutral, marginHorizontal: spacing.screen }} />;
}

export default function NotificationsScreen() {
  const c = useThemeColors();
  const { foregroundServiceEnabled, toggleForegroundService, routineNotificationsEnabled, setRoutineNotifications, todoNotificationsEnabled, setTodoNotifications } = useSettingsStore();
  const copy = NOTIFICATION_COPY;

  async function handleRoutine(enabled: boolean) { if (enabled && !(await requestNotificationPermission())) return; setRoutineNotifications(enabled); }
  async function handleTodo(enabled: boolean) { if (enabled && !(await requestNotificationPermission())) return; setTodoNotifications(enabled); }
  async function handleForeground() { if (!foregroundServiceEnabled && !(await requestNotificationPermission())) return; toggleForegroundService(); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.item, paddingBottom: spacing.sm, gap: spacing.item }}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로">
          <AppIcon name="ChevronLeft" size={20} color={c.ink} />
        </Pressable>
        <AppText variant="title">알림</AppText>
      </View>
      <ToggleRow label={copy.fastingBar.label} description={copy.fastingBar.description} value={foregroundServiceEnabled} onToggle={() => handleForeground()} />
      <Separator />
      <ToggleRow label={copy.routine.label} description={copy.routine.description} value={routineNotificationsEnabled} onToggle={handleRoutine} />
      <Separator />
      <ToggleRow label={copy.todo.label} description={copy.todo.description} value={todoNotificationsEnabled} onToggle={handleTodo} />
    </SafeAreaView>
  );
}
