import React from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { HoldToConfirmButton } from '@/components/HoldToConfirmButton';
import { estimateCaloriesBurned, getFastingMessage } from '@/constants/fastingMessages';
import { radius, spacing } from '@/constants/spacing';
import { useLiveElapsed } from '@/hooks/useLiveElapsed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatElapsed, formatOverElapsed, formatRelativeDate } from '@/utils/fastingFormat';

type Props = {
  startedAt: number;
  goalHours: number;
  onComplete: () => void;
  onAbandon: () => void;
  onEditStartTime?: () => void;
};

const TimerDisplay = React.memo(function TimerDisplay({
  startedAt,
  goalHours,
}: {
  startedAt: number;
  goalHours: number;
}) {
  const c = useThemeColors();
  const profile = useUserStore((s) => s.profile);

  const elapsedMs = useLiveElapsed(startedAt, true);
  const goalMs = goalHours * 3_600_000;
  const isOverGoal = elapsedMs >= goalMs;
  const progress = Math.min(elapsedMs / goalMs, 1);
  const accent = isOverGoal ? c.booster : c.primary;

  const phaseMessage = getFastingMessage(elapsedMs);
  const calories =
    profile.weightKg && profile.heightCm && profile.isMale !== null
      ? estimateCaloriesBurned({
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          ageYears: profile.ageYears ?? 30,
          isMale: profile.isMale,
          elapsedMs,
        })
      : null;

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
    </>
  );
});

const StaticInfo = React.memo(function StaticInfo({
  startedAt,
  goalHours,
  onEditStartTime,
}: {
  startedAt: number;
  goalHours: number;
  onEditStartTime?: () => void;
}) {
  const c = useThemeColors();
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');
  const goalMs = goalHours * 3_600_000;
  const completionTs = startedAt + goalMs;
  const start = formatRelativeDate(startedAt, timeFormat);
  const end = formatRelativeDate(completionTs, timeFormat);
  const isOverGoal = Date.now() - startedAt >= goalMs;
  const accent = isOverGoal ? c.booster : c.primary;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppText variant="caption" tone="tertiary">시작</AppText>
          {onEditStartTime && (
            <Pressable
              onPress={onEditStartTime}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="시작 시간 수정"
            >
              <AppIcon name="Pencil" size={10} color={c.inkTertiary} />
            </Pressable>
          )}
        </View>
        <AppText variant="caption" style={{ fontWeight: '600' }}>
          {start.timeLabel}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <AppText variant="caption" style={{ color: isOverGoal ? c.booster : c.inkTertiary }}>
          {isOverGoal ? '부스터' : '완료'}
        </AppText>
        <AppText variant="caption" style={{ fontWeight: '600', color: accent }}>
          {end.timeLabel}
        </AppText>
      </View>
    </View>
  );
});

const ActionButtons = React.memo(function ActionButtons({
  startedAt,
  goalHours,
  onComplete,
  onAbandon,
}: {
  startedAt: number;
  goalHours: number;
  onComplete: () => void;
  onAbandon: () => void;
}) {
  const c = useThemeColors();
  const goalMs = goalHours * 3_600_000;
  const isOverGoal = Date.now() - startedAt >= goalMs;

  return (
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
  );
});

export function FastingTimer({
  startedAt,
  goalHours,
  onComplete,
  onAbandon,
  onEditStartTime,
}: Props) {
  return (
    <>
      <StaticInfo startedAt={startedAt} goalHours={goalHours} onEditStartTime={onEditStartTime} />
      <TimerDisplay startedAt={startedAt} goalHours={goalHours} />
      <ActionButtons startedAt={startedAt} goalHours={goalHours} onComplete={onComplete} onAbandon={onAbandon} />
    </>
  );
}
