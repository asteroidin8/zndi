import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Routine } from '@/stores/useRoutineStore';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  routine: Routine;
  isCompleted?: boolean;
  onToggle?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function RoutineItem({ routine, isCompleted = false, onToggle, onLongPress, onPress }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress ?? onToggle}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
      }}
    >
      {/* 체크박스 */}
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: isCompleted ? c.ink : c.borderStrong,
          backgroundColor: isCompleted ? c.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isCompleted && <AppIcon name="Check" size={13} color={c.surface} strokeWidth={2.5} />}
      </Pressable>

      {/* 내용 */}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="body"
          tone={isCompleted ? 'tertiary' : 'primary'}
          style={isCompleted ? { textDecorationLine: 'line-through' } : {}}
        >
          {routine.name}
        </AppText>
        <AppText variant="caption" tone="disabled">
          {routine.repeatDays.map((d) => DAY_LABELS[d]).join('·')}
          {routine.reminderTime ? `  ·  ${routine.reminderTime}` : ''}
        </AppText>
      </View>
    </Pressable>
  );
}
