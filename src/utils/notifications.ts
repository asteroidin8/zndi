import * as Notifications from 'expo-notifications';

export const NOTIFICATION_ID = {
  fasting: 'fasting-progress',
  routinePrefix: 'routine-',
  todoPrefix: 'todo-due-',
} as const;

let handlerConfigured = false;

export function setupNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const id = notification.request.identifier;
      const isFasting = id === NOTIFICATION_ID.fasting;

      return {
        shouldShowBanner: !isFasting,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowList: !isFasting,
      };
    },
  });
}

export async function cancelNotificationsByPrefix(prefix: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
