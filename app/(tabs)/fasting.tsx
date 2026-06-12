import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { HoldToConfirmButton } from '@/components/HoldToConfirmButton';
import { WheelPicker } from '@/components/WheelPicker';
import {
  estimateCaloriesBurned,
  getFastingMessage,
} from '@/constants/fastingMessages';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { feedbackBooster, feedbackSuccess } from '@/utils/microFeedback';
import { useFastingStore } from '@/stores/useFastingStore';
import { useUserStore } from '@/stores/useUserStore';

const TAB_INDEX = 0 as const;

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
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `+${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

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
  else dayLabel = `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS_KO[date.getDay()]})`;

  return { timeLabel, dayLabel };
}

function formatTotalHours(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  if (h >= 1000) return `${(h / 1000).toFixed(1)}k h`;
  return `${h}h`;
}

export default function FastingScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { status, startedAt, goalHours, setGoalHours, startFasting, stopFasting, records } =
    useFastingStore();
  const { profile } = useUserStore();
  const [now, setNow] = useState(Date.now());
  const [pickerVisible, setPickerVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasOverGoalRef = useRef(false);
  const timerScale = useSharedValue(1);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const elapsedMs = status === 'fasting' && startedAt ? now - startedAt : 0;
  const goalMs = goalHours * 3_600_000;
  const isOverGoal = elapsedMs >= goalMs;
  const progress = Math.min(elapsedMs / goalMs, 1);
  const completionTs = startedAt ? startedAt + goalMs : null;

  useEffect(() => {
    if (status === 'fasting' && isOverGoal && !wasOverGoalRef.current) {
      feedbackBooster();
      timerScale.value = withSequence(withSpring(1.08, { damping: 8 }), withSpring(1));
    }
    wasOverGoalRef.current = status === 'fasting' && isOverGoal;
  }, [isOverGoal, status, timerScale]);

  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  // 누적 통계
  const completedRecords = records.filter((r) => r.result === 'completed' && r.endedAt);
  const totalFastMs = completedRecords.reduce(
    (acc, r) => acc + ((r.endedAt ?? r.startedAt) - r.startedAt),
    0,
  );
  const totalCount = records.length;
  const completedCount = completedRecords.length;

  const calories =
    profile.weightKg && profile.heightCm
      ? estimateCaloriesBurned({
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          ageYears: profile.ageYears ?? 30,
          isMale: profile.isMale ?? true,
          elapsedMs,
        })
      : null;

  const phaseMessage = status === 'fasting' ? getFastingMessage(elapsedMs) : null;


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ScrollView ref={scrollRef} scrollEnabled={false} contentContainerStyle={{ flexGrow: 1 }}>
      {/* ── 헤더 ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <AppText variant="title">단식</AppText>
      </View>

      {/* ── 누적 통계 카드 ── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: c.surfaceSubtle,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <View style={{ alignItems: 'center', gap: 2 }}>
            <AppText variant="display" style={{ fontSize: 22, fontWeight: '800', letterSpacing: -1 }}>
              {formatTotalHours(totalFastMs)}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              총 단식 시간
            </AppText>
          </View>

          <View style={{ width: 1, height: 32, backgroundColor: c.border }} />

          <View style={{ alignItems: 'center', gap: 2 }}>
            <AppText variant="display" style={{ fontSize: 22, fontWeight: '800', letterSpacing: -1 }}>
              {completedCount}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              완료 횟수
            </AppText>
          </View>

          <View style={{ width: 1, height: 32, backgroundColor: c.border }} />

          <View style={{ alignItems: 'center', gap: 2 }}>
            <AppText variant="display" style={{ fontSize: 22, fontWeight: '800', letterSpacing: -1 }}>
              {totalCount}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              전체 기록
            </AppText>
          </View>
        </View>
      </View>

      {/* ── 타이머 (정중앙) ── */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        {status === 'idle' && (
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <EmptyIllustration variant="fasting" size={56} />
            <AppText
              variant="body"
              tone="tertiary"
              style={{ textAlign: 'center', lineHeight: 22, paddingHorizontal: 40 }}
            >
              {`단식은 나를 리셋하는 시간이에요\n목표를 설정하고 시작해봐요`}
            </AppText>
          </View>
        )}
        <Animated.View style={timerAnimStyle}>
        <AppText
          variant="display"
          style={{
            fontSize: 62,
            letterSpacing: -3,
            lineHeight: 70,
            fontWeight: '700',
            color: isOverGoal && status === 'fasting' ? c.booster : c.ink,
            opacity: status === 'idle' ? 0.15 : 1,
          }}
        >
          {formatElapsed(elapsedMs)}
        </AppText>
        </Animated.View>

        {/* 타임라인 카드 */}
        {status === 'fasting' && startedAt && completionTs && (() => {
          const start = formatRelativeDate(startedAt);
          const end = formatRelativeDate(completionTs);
          return (
            <View style={{ width: '85%', gap: 10, marginTop: 4 }}>
              {/* 시작 / 완료 예정 */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View style={{ gap: 2 }}>
                  <AppText variant="caption" style={{ color: c.inkTertiary }}>시작</AppText>
                  <AppText variant="body" style={{ fontWeight: '700', letterSpacing: -0.5 }}>
                    {start.timeLabel}
                  </AppText>
                  <AppText variant="caption" tone="secondary">{start.dayLabel}</AppText>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <AppText variant="caption" style={{ color: isOverGoal ? c.booster : c.inkTertiary }}>
                    {isOverGoal ? '부스터' : '완료'}
                  </AppText>
                  <AppText
                    variant="body"
                    style={{ fontWeight: '700', letterSpacing: -0.5, color: isOverGoal ? c.booster : c.ink }}
                  >
                    {isOverGoal ? formatOverElapsed(elapsedMs - goalMs) : end.timeLabel}
                  </AppText>
                  {!isOverGoal && (
                    <AppText variant="caption" tone="secondary">{end.dayLabel}</AppText>
                  )}
                </View>
              </View>

              {/* 진행 바 */}
              <View style={{ height: 3, backgroundColor: c.surfaceMuted, borderRadius: 2, overflow: 'hidden' }}>
                <View
                  style={{
                    height: 3,
                    width: `${progress * 100}%`,
                    backgroundColor: isOverGoal ? c.booster : c.ink,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          );
        })()}

        {/* 과학 멘트 + 칼로리 */}
        {status === 'fasting' && (
          <View style={{ gap: 4, alignItems: 'center', marginTop: 4 }}>
            {phaseMessage && (
              <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                {phaseMessage}
              </AppText>
            )}
            {calories !== null && (
              <AppText variant="caption" tone="tertiary">
                약 {calories} kcal 소모
              </AppText>
            )}
          </View>
        )}
      </View>

      {/* ── 하단 ── */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 14 }}>
        <Divider />

        {/* 목표 설정 (idle 시만) */}
        {status === 'idle' && (
          <View style={{ gap: 10 }}>
            <AppText variant="caption" tone="tertiary">
              목표 시간
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {PRESETS.map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setGoalHours(h)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
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
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: !PRESETS.includes(goalHours as (typeof PRESETS)[number])
                    ? c.ink
                    : c.border,
                  backgroundColor: !PRESETS.includes(goalHours as (typeof PRESETS)[number])
                    ? c.surfaceSubtle
                    : 'transparent',
                  alignItems: 'center',
                }}
              >
                <AppText
                  variant="caption"
                  tone={
                    !PRESETS.includes(goalHours as (typeof PRESETS)[number]) ? 'primary' : 'tertiary'
                  }
                >
                  직접
                </AppText>
              </Pressable>
            </View>
            {!PRESETS.includes(goalHours as (typeof PRESETS)[number]) && (
              <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                목표: {goalHours}시간
              </AppText>
            )}
          </View>
        )}

        {/* CTA 버튼 */}
        {status === 'idle' ? (
          <Pressable
            onPress={startFasting}
            style={{
              backgroundColor: c.ink,
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: 'center',
            }}
          >
            <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
              단식 시작
            </AppText>
          </Pressable>
        ) : isOverGoal ? (
          <Pressable
            onPress={() => {
              feedbackSuccess();
              stopFasting('completed');
            }}
            style={{
              backgroundColor: c.ink,
              borderRadius: 14,
              paddingVertical: 18,
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
            onConfirm={() => stopFasting('abandoned')}
          />
        )}
      </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}
