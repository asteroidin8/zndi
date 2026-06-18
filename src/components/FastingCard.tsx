import { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import { HoldToConfirmButton } from './HoldToConfirmButton';
import { WheelPicker } from './WheelPicker';
import { estimateCaloriesBurned, getFastingMessage } from '@/constants/fastingMessages';
import { radius, size, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';
import { useUserStore } from '@/stores/useUserStore';
import { feedbackSuccess } from '@/utils/microFeedback';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GOAL_HOURS = Array.from({ length: 72 }, (_, i) => i + 1);
const PRESETS = [12, 16, 18, 24] as const;

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

export function FastingCard() {
  const c = useThemeColors();
  const { status, startedAt, goalHours, setGoalHours, startFasting, stopFasting } =
    useFastingStore();
  const { profile } = useUserStore();
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
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

  const calories =
    status === 'fasting' && profile.weightKg && profile.heightCm && profile.isMale !== null
      ? estimateCaloriesBurned({
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          ageYears: profile.ageYears ?? 30,
          isMale: profile.isMale,
          elapsedMs,
        })
      : null;

  const phaseMessage = status === 'fasting' ? getFastingMessage(elapsedMs) : null;

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }

  function handleStart() {
    startFasting();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(true);
  }

  function handleComplete() {
    feedbackSuccess();
    stopFasting('completed');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
  }

  function handleAbandon() {
    stopFasting('abandoned');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
  }

  const isCustomGoal = !PRESETS.includes(goalHours as (typeof PRESETS)[number]);

  if (status === 'idle' && !expanded) {
    return (
      <Card
        pressable
        onPress={toggleExpanded}
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

  if (status === 'fasting' && !expanded) {
    const start = startedAt ? formatRelativeDate(startedAt) : null;
    const end = completionTs ? formatRelativeDate(completionTs) : null;

    return (
      <Card
        pressable
        onPress={toggleExpanded}
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

  return (
    <Card>
      <Pressable
        onPress={toggleExpanded}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        accessibilityRole="button"
        accessibilityLabel={expanded ? '단식 접기' : '단식 펼치기'}
      >
        <AppText variant="caption" tone="secondary">
          {status === 'idle'
            ? '단식'
            : isOverGoal
              ? '부스터 모드'
              : `${goalHours}h 단식`}
        </AppText>
        <AppIcon name="ChevronUp" size={size.iconMd} color={c.inkTertiary} />
      </Pressable>

      {status === 'fasting' && (
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

          {startedAt && completionTs && (() => {
            const start = formatRelativeDate(startedAt);
            const end = formatRelativeDate(completionTs);
            return (
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
            );
          })()}

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
                onPress={handleComplete}
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
                onConfirm={handleAbandon}
              />
            )}
          </View>
        </>
      )}

      {status === 'idle' && (
        <>
          <View style={{ gap: spacing.sm, marginTop: spacing.card }}>
            <AppText variant="caption" tone="tertiary">목표 시간</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {PRESETS.map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setGoalHours(h)}
                  accessibilityRole="button"
                  accessibilityLabel={`${h}시간 목표`}
                  accessibilityState={{ selected: goalHours === h }}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: goalHours === h ? c.ink : c.border,
                    backgroundColor: goalHours === h ? c.surfaceSubtle : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <AppText
                    variant="caption"
                    tone={goalHours === h ? 'primary' : 'tertiary'}
                    style={goalHours === h ? { fontWeight: '700' } : {}}
                  >
                    {h}h
                  </AppText>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setPickerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="직접 입력"
                accessibilityState={{ selected: isCustomGoal }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: isCustomGoal ? c.ink : c.border,
                  backgroundColor: isCustomGoal ? c.surfaceSubtle : 'transparent',
                  alignItems: 'center',
                }}
              >
                <AppText variant="caption" tone={isCustomGoal ? 'primary' : 'tertiary'}>
                  직접
                </AppText>
              </Pressable>
            </View>
            {isCustomGoal && (
              <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                목표: {goalHours}시간
              </AppText>
            )}
          </View>

          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="단식 시작"
            style={{
              backgroundColor: c.ink,
              borderRadius: radius.md,
              paddingVertical: spacing.item,
              alignItems: 'center',
              marginTop: spacing.card,
            }}
          >
            <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
              단식 시작
            </AppText>
          </Pressable>
        </>
      )}

      <WheelPicker
        visible={pickerVisible}
        title="목표 시간 선택"
        values={GOAL_HOURS}
        selectedValue={goalHours}
        unit="시간"
        onConfirm={(v) => {
          setGoalHours(v);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </Card>
  );
}
