import { View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { radius, size, spacing } from '@/constants/spacing';
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
  onPress: () => void;
};

export function FastingCardCollapsed({
  status,
  goalHours,
  elapsedMs,
  isOverGoal,
  progress,
  startedAt,
  completionTs,
  onPress,
}: Props) {
  const c = useThemeColors();
  const accent = isOverGoal ? c.booster : c.primary;

  if (status === 'idle') {
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
