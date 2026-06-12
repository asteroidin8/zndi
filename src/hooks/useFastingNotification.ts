import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useFastingStore } from '@/stores/useFastingStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

const NOTIFICATION_ID = 'fasting-progress';
const FASTING_CHANNEL_ID = 'fasting';
const UPDATE_INTERVAL_MS = 60_000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowList: false,
  }),
});

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}시간 ${m}분 진행 중`;
}

function buildNotificationContent(elapsed: number, goalHours: number) {
  const goalMs = goalHours * 3_600_000;
  const progress = Math.min(elapsed / goalMs, 1);
  const isOver = elapsed > goalMs;

  return {
    title: isOver ? `목표 달성! ${formatElapsed(elapsed)}` : `단식 중 · ${Math.round(progress * 100)}%`,
    body: formatElapsed(elapsed),
    sound: false as const,
    sticky: true,
    autoDismiss: false,
    ...(Platform.OS === 'android' && {
      priority: Notifications.AndroidNotificationPriority.LOW,
    }),
  };
}

function getImmediateTrigger(): Notifications.NotificationTriggerInput {
  // Android: trigger null이면 기본 채널로 떨어져 매 업데이트마다 알림이 울릴 수 있음
  if (Platform.OS === 'android') {
    return { channelId: FASTING_CHANNEL_ID };
  }
  return null;
}

async function ensureFastingChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(FASTING_CHANNEL_ID, {
      name: '단식 진행',
      importance: Notifications.AndroidImportance.LOW,
      enableVibrate: false,
      showBadge: false,
      sound: null,
    });
  }
  await Notifications.requestPermissionsAsync();
}

async function showFastingNotification(elapsed: number, goalHours: number) {
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: buildNotificationContent(elapsed, goalHours),
    trigger: getImmediateTrigger(),
  });
}

export function useFastingNotification() {
  const { status, startedAt, goalHours } = useFastingStore();
  const { foregroundServiceEnabled } = useSettingsStore();
  const lastSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (!foregroundServiceEnabled) {
      lastSnapshotRef.current = null;
      Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => {});
      return;
    }

    if (status !== 'fasting' || !startedAt) {
      lastSnapshotRef.current = null;
      Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => {});
      return;
    }

    let cancelled = false;

    async function updateIfChanged() {
      const elapsed = Date.now() - startedAt!;
      const snapshot = buildNotificationContent(elapsed, goalHours);
      const snapshotKey = `${snapshot.title}|${snapshot.body}`;

      if (lastSnapshotRef.current === snapshotKey) return;
      lastSnapshotRef.current = snapshotKey;

      await showFastingNotification(elapsed, goalHours);
    }

    async function start() {
      await ensureFastingChannel();
      if (cancelled) return;
      await updateIfChanged();
    }

    start();

    const interval = setInterval(() => {
      updateIfChanged().catch(() => {});
    }, UPDATE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, startedAt, goalHours, foregroundServiceEnabled]);
}
