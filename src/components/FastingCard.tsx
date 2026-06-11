import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const hour = h % 12 || 12;
  return `${ampm} ${hour}:${String(m).padStart(2, '0')}`;
}

type Props = {
  onPress?: () => void;
};

export function FastingCard({ onPress }: Props) {
  const c = useThemeColors();
  const { status, startedAt, goalHours } = useFastingStore();
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'fasting') {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const elapsedMs = status === 'fasting' && startedAt ? now - startedAt : 0;
  const goalMs = goalHours * 3_600_000;
  const isOverGoal = elapsedMs > goalMs;
  const progress = Math.min(elapsedMs / goalMs, 1);

  const completionTime = startedAt ? new Date(startedAt + goalMs) : null;
  const completionLabel = completionTime
    ? `${formatTime(completionTime.getTime())} 완료 예정`
    : null;

  if (status === 'idle') {
    return (
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: c.surfaceSubtle,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <AppText variant="caption" tone="tertiary">
          단식
        </AppText>
        <AppText variant="title" style={{ marginTop: 8 }}>
          다음 단식을 시작하세요
        </AppText>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}
        >
          <AppIcon name="PlayCircle" size={18} />
          <AppText variant="body" tone="secondary">
            단식 시작하기
          </AppText>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: c.surfaceSubtle,
        borderWidth: 1,
        borderColor: c.borderStrong,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" tone="secondary">
          {goalHours}시간 단식 도전 중
        </AppText>
        <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />
      </View>

      {/* 타이머 */}
      <AppText
        variant="display"
        style={{ marginTop: 10, fontSize: 40, letterSpacing: -2 }}
      >
        {formatElapsed(elapsedMs)}
      </AppText>

      {/* 초과 표시 */}
      {isOverGoal && (
        <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
          +{formatElapsed(elapsedMs - goalMs)} 초과
        </AppText>
      )}

      {/* 진행 바 */}
      <View
        style={{
          height: 2,
          backgroundColor: c.surfaceMuted,
          borderRadius: 1,
          marginTop: 12,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: 2,
            width: `${progress * 100}%`,
            backgroundColor: c.ink,
            borderRadius: 1,
          }}
        />
      </View>

      {/* 완료 예정 시각 */}
      {completionLabel && (
        <AppText variant="caption" tone="tertiary" style={{ marginTop: 8 }}>
          {completionLabel}
        </AppText>
      )}
    </Pressable>
  );
}
