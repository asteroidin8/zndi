import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { SheetDangerButton, SheetModal, SheetPrimaryButton } from './SheetModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Routine, Weekday } from '@/stores/useRoutineStore';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

type Props = {
  visible: boolean;
  initial?: Partial<Routine>;
  onSave: (data: { name: string; repeatDays: Weekday[]; reminderTime: string | null }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function RoutineModal({ visible, initial, onSave, onDelete, onClose }: Props) {
  const c = useThemeColors();
  const [name, setName] = useState(initial?.name ?? '');
  const [days, setDays] = useState<Weekday[]>(initial?.repeatDays ?? [1, 2, 3, 4, 5]);

  function toggleDay(day: Weekday) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), repeatDays: days, reminderTime: null });
    setName('');
    setDays([1, 2, 3, 4, 5]);
  }

  const canSave = !!name.trim();

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={initial?.id ? '루틴 편집' : '루틴 추가'}
      footer={
        <>
          <SheetPrimaryButton label="저장" onPress={handleSave} disabled={!canSave} />
          {onDelete ? <SheetDangerButton label="삭제" onPress={onDelete} /> : null}
        </>
      }
    >
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="되고 싶은 내 모습을 입력해보세요"
        placeholderTextColor={c.inkDisabled}
        autoFocus
        style={{
          fontSize: 16,
          color: c.ink,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          paddingVertical: 8,
          marginBottom: 24,
        }}
      />

      <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
        반복 요일
      </AppText>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {ALL_DAYS.map((day) => (
          <Pressable
            key={day}
            onPress={() => toggleDay(day)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: days.includes(day) ? c.ink : c.border,
              backgroundColor: days.includes(day) ? c.surfaceSubtle : 'transparent',
              alignItems: 'center',
            }}
          >
            <AppText
              variant="caption"
              tone={days.includes(day) ? 'primary' : 'tertiary'}
              style={days.includes(day) ? { fontWeight: '700' } : {}}
            >
              {DAY_LABELS[day]}
            </AppText>
          </Pressable>
        ))}
      </View>
    </SheetModal>
  );
}
