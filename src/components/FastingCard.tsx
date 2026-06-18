import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import { radius, size, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';

function formatElapsed(ms: number) {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatOverElapsed(ms: number) {
  return `+${formatElapsed(ms)}`;
}

function formatRelativeDate(ts: number): { timeLabel: string; dayLabel: string } {
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateMidnight = new Date(date);
  dateMidnight.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dateMidnight.getTime() - today.getTime()) / 86_400_000);

  const h = date.getHours();
  const min = date.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const timeLabel = `${ampm} ${h % 12 || 12}:${String(min).padStart(2, '0')}`;

  let dayLabel: string;
  if (diffDays === 0) dayLabel = '오늘';
  else if (diffDays === 1) dayLabel = '내일';
  else if (diffDays === 2) dayLabel = '모레';
  else dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

  return { timeLabel, dayLabel };
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
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const elapsedMs = status === 'fasting' && startedAt ? now - startedAt : 0;
  const goalMs = goalHours * 3_600_000;
  const isOverGoal = elapsedMs >= goalMs;
  const progress = Math.min(elapsedMs / goalMs, 1);
  const completionTs = startedAt ? startedAt + goalMs : null;
  const accent = isOverGoal ? c.booster : c.primary;

  if (status === 'idle') {
    return (
      <Card pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="단식, 도전하기">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: spacing.sm + 2 }}>
            <AppText variant="caption" tone="secondary">
              단식
            </AppText>
            <AppText variant="title">도전하기</AppText>
            <AppText variant="caption" tone="tertiary">
              시작 전
            </AppText>
          </View>
          <AppIcon name="ChevronRight" size={size.iconMd} color={c.inkTertiary} />
        </View>
      </Card>
    );
  }

  const start = startedAt ? formatRelativeDate(startedAt) : null;
  const end = completionTs ? formatRelativeDate(completionTs) : null;

  return (
    <Card pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="단식 화면으로 이동">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" tone="secondary">
          {isOverGoal ? '부스터 모드' : `${goalHours}시간 단식`}
        </AppText>
        <AppIcon name="ChevronRight" size={size.iconMd} color={c.inkTertiary} />
      </View>

      <AppText
        variant="display"
        style={{
          marginTop: spacing.sm + 2,
          fontSize: 40,
          letterSpacing: -2,
          fontWeight: '700',
          color: accent,
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatElapsed(elapsedMs)}
      </AppText>

      {start && end && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="caption" tone="tertiary">시작</AppText>
              <AppText variant="caption" style={{ fontWeight: '600' }}>{start.timeLabel}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="caption" style={{ color: isOverGoal ? c.booster : c.inkTertiary }}>
                {isOverGoal ? '부스터' : '완료'}
              </AppText>
              <AppText variant="caption" style={{ fontWeight: '600', color: accent }}>
                {isOverGoal ? formatOverElapsed(elapsedMs - goalMs) : end.timeLabel}
              </AppText>
            </View>
          </View>
          <View style={{ height: size.progressBar, backgroundColor: c.surfaceMuted, borderRadius: radius.xs, overflow: 'hidden' }}>
            <View
              style={{
                height: size.progressBar,
                width: `${progress * 100}%`,
                backgroundColor: accent,
                borderRadius: radius.xs,
              }}
            />
          </View>
        </View>
      )}
    </Card>
  );
}
