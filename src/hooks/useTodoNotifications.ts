import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';

export function useTodoNotifications() {
  const { todos } = useTodoStore();
  const { todoNotificationsEnabled } = useSettingsStore();

  useEffect(() => {
    if (!todoNotificationsEnabled) return;

    async function schedule() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const activeTodos = todos.filter((t) => !t.completedAt && t.dueDate);

      for (const todo of activeTodos) {
        if (!todo.dueDate) continue;

        const trigger = new Date(`${todo.dueDate}T09:00:00`);
        if (trigger <= new Date()) continue;

        await Notifications.scheduleNotificationAsync({
          identifier: `todo-due-${todo.id}`,
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

    schedule();
  }, [todos, todoNotificationsEnabled]);
}
