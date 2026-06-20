import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { HoldToConfirmButton } from '@/components/HoldToConfirmButton';
import { radius, size, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatElapsed, formatOverElapsed, formatRelativeDate } from '@/utils/fastingFormat';

type Props = {
  elapsedMs: number;
  goalMs: number;
  isOverGoal: boolean;
  progress: number;
  startedAt: number;
  completionTs: number;
  phaseMessage: string | null;
  calories: number | null;
  onComplete: () => void;
  onAbandon: () => void;
};

export function FastingTimer({
  elapsedMs,
  goalMs,
  isOverGoal,
  progress,
  startedAt,
  completionTs,
  phaseMessage,
  calories,
  onComplete,
  onAbandon,
}: Props) {
  const c = useThemeColors();
  const accent = isOverGoal ? c.booster : c.primary;
  const start = formatRelativeDate(startedAt);
  const end = formatRelativeDate(completionTs);

  return (
    <>
      <AppText
        variant="display"
        accessibilityRole="timer"
        style={{
          marginTop: spacing.md,
          fontSize: 40,
          letterSpacing: -2,
          fontWeight: '700',
          color: accent,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
        }}
      >
        {formatElapsed(elapsedMs)}
      </AppText>

      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <AppText variant="caption" tone="tertiary">시작</AppText>
            <AppText variant="caption" style={{ fontWeight: '600' }}>
              {start.timeLabel}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
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

      <View style={{ gap: spacing.xs, alignItems: 'center', marginTop: spacing.md }}>
        {phaseMessage && (
          <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
            {phaseMessage}
          </AppText>
        )}
        {calories !== null && (
          <AppText variant="caption" tone="tertiary">
            약 {calories} kcal 소모
          </AppText>
        )}
      </View>

      <View style={{ marginTop: spacing.card }}>
        {isOverGoal ? (
          <Pressable
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel="단식 완료"
            style={{
              backgroundColor: c.ink,
              borderRadius: radius.md,
              paddingVertical: spacing.item,
              alignItems: 'center',
            }}
          >
            <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
              단식 완료
            </AppText>
          </Pressable>
        ) : (
          <HoldToConfirmButton
            label="단식 포기"
            subLabel="꾹 눌러서 포기"
            onConfirm={onAbandon}
          />
        )}
      </View>
    </>
  );
}
