import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { WheelPicker } from '@/components/WheelPicker';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

const GOAL_HOURS = Array.from({ length: 72 }, (_, i) => i + 1);
const PRESETS = [
  { hours: 12, desc: '소화 리셋' },
  { hours: 16, desc: '지방 연소' },
  { hours: 18, desc: '케토시스' },
  { hours: 24, desc: '오토파지' },
] as const;

type Props = {
  goalHours: number;
  onGoalChange: (h: number) => void;
  onStart: () => void;
};

export function FastingGoalPicker({ goalHours, onGoalChange, onStart }: Props) {
  const c = useThemeColors();
  const [pickerVisible, setPickerVisible] = useState(false);
  const isCustomGoal = !PRESETS.some((p) => p.hours === goalHours);

  return (
    <>
      <View style={{ gap: spacing.sm, marginTop: spacing.card }}>
        <AppText variant="caption" tone="tertiary">목표 시간</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {PRESETS.map(({ hours, desc }) => {
            const selected = goalHours === hours;
            return (
              <Pressable
                key={hours}
                onPress={() => onGoalChange(hours)}
                accessibilityRole="button"
                accessibilityLabel={`${hours}시간 목표, ${desc}`}
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: selected ? c.ink : c.border,
                  backgroundColor: selected ? c.surfaceSubtle : 'transparent',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <AppText
                  variant="caption"
                  tone={selected ? 'primary' : 'tertiary'}
                  style={selected ? { fontWeight: '700' } : {}}
                >
                  {hours}h
                </AppText>
                <AppText
                  variant="caption"
                  tone="disabled"
                  style={{ fontSize: 9 }}
                >
                  {desc}
                </AppText>
              </Pressable>
            );
          })}
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
