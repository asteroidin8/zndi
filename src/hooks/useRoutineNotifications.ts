import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';

export function useRoutineNotifications() {
  const { routines } = useRoutineStore();
  const { routineNotificationsEnabled } = useSettingsStore();

  useEffect(() => {
    async function sync() {
      if (!routineNotificationsEnabled) {
        await cancelNotificationsByPrefix(NOTIFICATION_ID.routinePrefix);
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      await cancelNotificationsByPrefix(NOTIFICATION_ID.routinePrefix);

      for (const routine of routines) {
        if (!routine.reminderTime) continue;

        const [hStr, mStr] = routine.reminderTime.split(':');
        const hour = parseInt(hStr, 10);
        const minute = parseInt(mStr, 10);
        if (isNaN(hour) || isNaN(minute)) continue;

        const repeatType = routine.repeatType ?? 'weekly';

        if (repeatType === 'daily') {
          await Notifications.scheduleNotificationAsync({
            identifier: `${NOTIFICATION_ID.routinePrefix}${routine.id}-daily`,
            content: {
              title: '루틴 알림',
              body: routine.name,
              data: { routineId: routine.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
            },
          }).catch(() => {});
        } else if (repeatType === 'monthly') {
          for (const day of routine.monthDates ?? []) {
            await Notifications.scheduleNotificationAsync({
              identifier: `${NOTIFICATION_ID.routinePrefix}${routine.id}-m${day}`,
              content: {
                title: '루틴 알림',
                body: routine.name,
                data: { routineId: routine.id },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
                day,
                hour,
                minute,
              },
            }).catch(() => {});
          }
        } else {
          for (const weekday of routine.repeatDays) {
            const expoWeekday = weekday + 1;
            await Notifications.scheduleNotificationAsync({
              identifier: `${NOTIFICATION_ID.routinePrefix}${routine.id}-${weekday}`,
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
    }

    sync();
  }, [routines, routineNotificationsEnabled]);
}
