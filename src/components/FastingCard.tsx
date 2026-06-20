import { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import { FastingCardCollapsed } from './fasting/FastingCardCollapsed';
import { FastingGoalPicker } from './fasting/FastingGoalPicker';
import { FastingTimer } from './fasting/FastingTimer';
import { estimateCaloriesBurned, getFastingMessage } from '@/constants/fastingMessages';
import { size } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFastingStore } from '@/stores/useFastingStore';
import { useUserStore } from '@/stores/useUserStore';
import { feedbackSuccess } from '@/utils/microFeedback';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function FastingCard() {
  const c = useThemeColors();
  const { status, startedAt, goalHours, setGoalHours, startFasting, stopFasting } =
    useFastingStore();
  const { profile } = useUserStore();
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState(false);
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

  if (!expanded) {
    return (
      <FastingCardCollapsed
        status={status}
        goalHours={goalHours}
        elapsedMs={elapsedMs}
        isOverGoal={isOverGoal}
        progress={progress}
        startedAt={startedAt}
        completionTs={completionTs}
        onPress={toggleExpanded}
      />
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

      {status === 'fasting' && startedAt && completionTs && (
        <FastingTimer
          elapsedMs={elapsedMs}
          goalMs={goalMs}
          isOverGoal={isOverGoal}
          progress={progress}
          startedAt={startedAt}
          completionTs={completionTs}
          phaseMessage={phaseMessage}
          calories={calories}
          onComplete={handleComplete}
          onAbandon={handleAbandon}
        />
      )}

      {status === 'idle' && (
        <FastingGoalPicker
          goalHours={goalHours}
          onGoalChange={setGoalHours}
          onStart={handleStart}
        />
      )}
    </Card>
  );
}
