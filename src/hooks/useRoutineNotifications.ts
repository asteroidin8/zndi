import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

const ROUTINE_NOTIFICATION_CHANNEL = 'routine-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export function useRoutineNotifications() {
  const { routines } = useRoutineStore();
  const { routineNotificationsEnabled } = useSettingsStore();

  useEffect(() => {
    if (!routineNotificationsEnabled) {
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      return;
    }

    async function scheduleAll() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const routine of routines) {
        if (!routine.reminderTime) continue;

        const [hStr, mStr] = routine.reminderTime.split(':');
        const hour = parseInt(hStr, 10);
        const minute = parseInt(mStr, 10);
        if (isNaN(hour) || isNaN(minute)) continue;

        for (const weekday of routine.repeatDays) {
          // expo-notifications weekday: 1=일, 2=월, ..., 7=토
          const expoWeekday = weekday + 1;
          await Notifications.scheduleNotificationAsync({
            identifier: `routine-${routine.id}-${weekday}`,
            content: {
              title: '루틴 알림',
              body: routine.name,
              data: { routineId: routine.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour,
              minute,
            },
          }).catch(() => {});
        }
      }
    }

    scheduleAll();
  }, [routines, routineNotificationsEnabled]);
}
