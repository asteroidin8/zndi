import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';

export function useTodoNotifications() {
  const { todos } = useTodoStore();
  const { todoNotificationsEnabled } = useSettingsStore();

  useEffect(() => {
    async function sync() {
      if (!todoNotificationsEnabled) {
        await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);

      const activeTodos = todos.filter((t) => !t.completedAt && t.dueDate);

      for (const todo of activeTodos) {
        if (!todo.dueDate) continue;

        const trigger = new Date(`${todo.dueDate}T09:00:00`);
        if (trigger <= new Date()) continue;

        await Notifications.scheduleNotificationAsync({
          identifier: `${NOTIFICATION_ID.todoPrefix}${todo.id}`,
          content: {
            title: '오늘 마감인 할일이 있어요',
            body: todo.title,
            data: { todoId: todo.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        }).catch(() => {});
      }
    }

    sync();
  }, [todos, todoNotificationsEnabled]);
}
