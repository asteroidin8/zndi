import { View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { size, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { FastingStatus } from '@/types';
import { formatElapsed, formatRelativeDate } from '@/utils/fastingFormat';

type Props = {
  status: FastingStatus;
  goalHours: number;
  elapsedMs: number;
  isOverGoal: boolean;
  progress: number;
  startedAt: number | null;
  completionTs: number | null;
  lastRecord?: { startedAt: number; goalHours: number; result: string | null } | null;
  onPress: () => void;
};

function formatLastRecord(record: NonNullable<Props['lastRecord']>): string {
  const now = Date.now();
  const daysDiff = Math.floor((now - record.startedAt) / 86_400_000);
  const when = daysDiff === 0 ? '오늘' : daysDiff === 1 ? '어제' : `${daysDiff}일 전`;
  const resultLabel = record.result === 'completed' ? '완료' : record.result === 'abandoned' ? '포기' : '';
  return `${when} ${record.goalHours}h ${resultLabel}`;
}

export function FastingCardCollapsed({
  status,
  goalHours,
  elapsedMs,
  isOverGoal,
  progress,
  startedAt,
  completionTs,
  lastRecord,
  onPress,
}: Props) {
  const c = useThemeColors();
  const accent = isOverGoal ? c.booster : c.primary;

  if (status === 'idle') {
    const daysSinceLast = lastRecord ? Math.floor((Date.now() - lastRecord.startedAt) / 86_400_000) : 0;

    return (
      <Card
        pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="단식, 도전하기"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="tertiary">단식</AppText>
            <AppText variant="body" style={{ fontWeight: '600' }}>도전하기</AppText>
            {lastRecord && (
              <AppText variant="caption" tone="disabled">
                {daysSinceLast >= 7 ? '잔디가 기다리고 있어요' : `마지막: ${formatLastRecord(lastRecord)}`}
              </AppText>
            )}
          </View>
          <AppIcon name="ChevronDown" size={size.iconMd} color={c.inkTertiary} />
        </View>
      </Card>
    );
  }

  const start = startedAt ? formatRelativeDate(startedAt) : null;
  const end = completionTs ? formatRelativeDate(completionTs) : null;

  return (
    <Card
      pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="단식 상세 보기"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" tone="secondary">
          {isOverGoal ? '부스터 모드' : `${goalHours}h 단식`}
        </AppText>
        <AppIcon name="ChevronDown" size={size.iconMd} color={c.inkTertiary} />
      </View>

      <AppText
        variant="display"
        style={{
          marginTop: spacing.sm,
          fontSize: 36,
          letterSpacing: -2,
          fontWeight: '700',
          color: accent,
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatElapsed(elapsedMs)}
      </AppText>

      {start && end && (
        <View style={{ marginTop: spacing.sm }}>
          <View style={{ height: 6, backgroundColor: c.surfaceMuted, borderRadius: 3, overflow: 'visible' }}>
            <View
              style={{
                height: 6,
                width: `${progress * 100}%`,
                backgroundColor: accent,
                borderRadius: 3,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: -3,
                left: `${progress * 100}%`,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: accent,
                marginLeft: -6,
                shadowColor: accent,
                shadowOpacity: 0.7,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              }}
            />
          </View>
        </View>
      )}
    </Card>
  );
}
