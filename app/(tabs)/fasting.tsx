import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { WheelPicker } from '@/components/WheelPicker';
import {
  estimateCaloriesBurned,
  getFastingMessage,
} from '@/constants/fastingMessages';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';
import { useUserStore } from '@/stores/useUserStore';

const GOAL_HOURS = [12, 14, 16, 18, 20, 24, 36, 48, 72];
const PRESETS = [12, 16, 18, 24] as const;

function formatElapsed(ms: number, sign: '+' | '' = '') {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const base = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return sign + base;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  return `${ampm} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
}

export default function FastingScreen() {
  const c = useThemeColors();
  const { status, startedAt, goalHours, setGoalHours, startFasting, stopFasting } =
    useFastingStore();
  const { profile } = useUserStore();
  const [now, setNow] = useState(Date.now());
  const [pickerVisible, setPickerVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const elapsedMs = status === 'fasting' && startedAt ? now - startedAt : 0;
  const goalMs = goalHours * 3_600_000;
  const isOverGoal = elapsedMs > goalMs;
  const progress = Math.min(elapsedMs / goalMs, 1);
  const completionTs = startedAt ? startedAt + goalMs : null;

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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <AppText variant="title">단식</AppText>

        {/* 타이머 영역 */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <AppText
            variant="display"
            style={{ fontSize: 64, letterSpacing: -3, lineHeight: 72 }}
          >
            {formatElapsed(elapsedMs)}
          </AppText>

          {isOverGoal && (
            <AppText variant="body" tone="secondary">
              {formatElapsed(elapsedMs - goalMs, '+')} 초과
            </AppText>
          )}

          {status === 'fasting' && completionTs && !isOverGoal && (
            <AppText variant="caption" tone="tertiary">
              {formatTime(completionTs)} 완료 예정
            </AppText>
          )}

          {status === 'fasting' && startedAt && (
            <AppText variant="caption" tone="tertiary">
              {formatTime(startedAt)} 시작
            </AppText>
          )}
        </View>

        {/* 진행 바 */}
        <View
          style={{
            height: 2,
            backgroundColor: c.surfaceMuted,
            borderRadius: 1,
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

        {/* 과학 멘트 + 칼로리 */}
        {status === 'fasting' && (
          <View style={{ gap: 4 }}>
            {phaseMessage && (
              <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                {phaseMessage}
              </AppText>
            )}
            {calories !== null && (
              <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
                약 {calories} kcal 소모
              </AppText>
            )}
          </View>
        )}

        <Divider />

        {/* 목표 설정 */}
        <View style={{ gap: 12 }}>
          <AppText variant="caption" tone="tertiary">
            목표 시간
          </AppText>

          {/* 프리셋 버튼 */}
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
                  {h}시간
                </AppText>
              </Pressable>
            ))}

            {/* 직접 버튼 — 휠 피커 열기 */}
            <Pressable
              onPress={() => setPickerVisible(true)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: !PRESETS.includes(goalHours as typeof PRESETS[number]) ? c.ink : c.border,
                backgroundColor: !PRESETS.includes(goalHours as typeof PRESETS[number])
                  ? c.surfaceSubtle
                  : 'transparent',
                alignItems: 'center',
              }}
            >
              <AppText
                variant="caption"
                tone={!PRESETS.includes(goalHours as typeof PRESETS[number]) ? 'primary' : 'tertiary'}
              >
                직접
              </AppText>
            </Pressable>
          </View>

          {!PRESETS.includes(goalHours as typeof PRESETS[number]) && (
            <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
              목표: {goalHours}시간
            </AppText>
          )}
        </View>

        {/* 시작 / 중단 버튼 */}
        {status === 'idle' ? (
          <Pressable
            onPress={startFasting}
            style={{
              backgroundColor: c.ink,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <AppText variant="body" style={{ color: c.surface, fontWeight: '600' }}>
              단식 시작
            </AppText>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => stopFasting('completed')}
              style={{
                backgroundColor: c.ink,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <AppText variant="body" style={{ color: c.surface, fontWeight: '600' }}>
                단식 완료
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => stopFasting('abandoned')}
              style={{
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppIcon name="X" size={15} color={c.inkTertiary} />
                <AppText variant="body" tone="tertiary">
                  중도 포기 (기록 보존)
                </AppText>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* 목표 시간 휠 피커 */}
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
    </SafeAreaView>
  );
}
