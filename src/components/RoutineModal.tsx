import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { Divider } from './Divider';
import { SpringModal } from './SpringModal';
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

  return (
    <SpringModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View
        style={{
          backgroundColor: c.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingBottom: 34,
        }}
      >
        {/* 핸들 */}
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: c.surfaceMuted,
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 14,
          }}
        />

        <AppText variant="title" style={{ marginBottom: 20 }}>
          {initial?.id ? '루틴 편집' : '루틴 추가'}
        </AppText>

        {/* 루틴 이름 */}
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

        {/* 요일 선택 */}
        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
          반복 요일
        </AppText>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 28 }}>
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

        <Divider spacing={0} />

        <Pressable
          onPress={handleSave}
          disabled={!name.trim()}
          style={{
            backgroundColor: name.trim() ? c.ink : c.surfaceMuted,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <AppText
            variant="body"
            style={{ color: name.trim() ? c.surface : c.inkDisabled, fontWeight: '600' }}
          >
            저장
          </AppText>
        </Pressable>

        {onDelete && (
          <>
            <Divider spacing={4} />
            <Pressable
              onPress={onDelete}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <AppText variant="body" style={{ color: c.danger }}>
                삭제
              </AppText>
            </Pressable>
          </>
        )}
      </View>
      </KeyboardAvoidingView>
    </SpringModal>
  );
}
