import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useRef } from 'react';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { cancelNotificationsByPrefix, NOTIFICATION_ID } from '@/utils/notifications';

const DEBOUNCE_MS = 2000;

export function useTodoNotifications() {
  const todos = useTodoStore((s) => s.todos);
  const todoNotificationsEnabled = useSettingsStore((s) => s.todoNotificationsEnabled);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifFingerprint = useMemo(() =>
    todos
      .filter((t) => !t.deletedAt && !t.completedAt && t.dueDate)
      .map((t) => `${t.id}:${t.dueDate}`)
      .join('|'),
    [todos],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      sync();
    }, DEBOUNCE_MS);

    async function sync() {
      if (!todoNotificationsEnabled) {
        await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      await cancelNotificationsByPrefix(NOTIFICATION_ID.todoPrefix);

      const activeTodos = todos.filter((t) => !t.deletedAt && !t.completedAt && t.dueDate);

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

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notifFingerprint, todoNotificationsEnabled]);
}
