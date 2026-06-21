import { Pressable, View } from 'react-native';

import { CompletionCheckbox } from './CompletionCheckbox';
import { AppText } from './AppText';
import { opacity, size, spacing } from '@/constants/spacing';
import { feedbackComplete, feedbackUncomplete } from '@/utils/microFeedback';
import type { Routine } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatTimeDisplay } from '@/utils/dateFormat';
import { formatRepeatLabel } from '@/utils/routineSchedule';

type Props = {
  routine: Routine;
  isCompleted?: boolean;
  onToggle?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function RoutineItem({ routine, isCompleted = false, onToggle, onLongPress, onPress }: Props) {
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');
  function handleToggle() {
    if (isCompleted) feedbackUncomplete();
    else feedbackComplete();
    onToggle?.();
  }

  return (
    <Pressable
      onPress={onPress ?? handleToggle}
      onLongPress={onLongPress}
      delayLongPress={280}
      accessibilityRole="button"
      accessibilityLabel={`${routine.name} 루틴${isCompleted ? ', 완료됨' : ''}`}
      accessibilityHint="길게 눌러 순서 변경"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.item,
        gap: spacing.item,
        minHeight: size.touchTarget,
        opacity: isCompleted ? opacity.completed : 1,
      }}
    >
      <CompletionCheckbox
        checked={isCompleted}
        onToggle={handleToggle}
        label={`${routine.name} 완료 토글`}
        iconSize={13}
      />

      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText
          variant="body"
          tone={isCompleted ? 'tertiary' : 'primary'}
          style={isCompleted ? { textDecorationLine: 'line-through' } : {}}
        >
          {routine.name}
        </AppText>
        <AppText variant="caption" tone="disabled">
          {formatRepeatLabel(routine)}
          {routine.reminderTime ? `  ·  ${formatTimeDisplay(routine.reminderTime, timeFormat)}` : ''}
        </AppText>
      </View>
    </Pressable>
  );
}
