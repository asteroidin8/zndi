import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { WheelPicker } from '@/components/WheelPicker';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

const GOAL_HOURS = Array.from({ length: 72 }, (_, i) => i + 1);
const PRESETS = [12, 16, 18, 24] as const;

type Props = {
  goalHours: number;
  onGoalChange: (h: number) => void;
  onStart: () => void;
};

export function FastingGoalPicker({ goalHours, onGoalChange, onStart }: Props) {
  const c = useThemeColors();
  const [pickerVisible, setPickerVisible] = useState(false);
  const isCustomGoal = !PRESETS.includes(goalHours as (typeof PRESETS)[number]);

  return (
    <>
      <View style={{ gap: spacing.sm, marginTop: spacing.card }}>
        <AppText variant="caption" tone="tertiary">목표 시간</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {PRESETS.map((h) => (
            <Pressable
              key={h}
              onPress={() => onGoalChange(h)}
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
        onPress={onStart}
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

      <WheelPicker
        visible={pickerVisible}
        title="목표 시간 선택"
        values={GOAL_HOURS}
        selectedValue={goalHours}
        unit="시간"
        onConfirm={(v) => {
          onGoalChange(v);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}
