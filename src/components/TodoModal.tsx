import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { DatePickerModal } from './DatePickerModal';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { type TodoPriority } from '@/stores/useTodoStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPriorityColor } from '@/utils/dateFormat';

export type TodoCreatePayload = {
  title: string;
  priority: TodoPriority;
  dueDate: string | null;
};

type Props = {
  visible: boolean;
  onSave: (payload: TodoCreatePayload) => void;
  onClose: () => void;
};

const PRIORITY_LABELS: { value: TodoPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'mid', label: '보통' },
  { value: 'low', label: '낮음' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDueDate(s: string) {
  const [, m, d] = s.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function shiftDate(base: string, days: number) {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DUE_SHORTCUTS = [
  { label: '오늘', offset: 0 },
  { label: '내일', offset: 1 },
  { label: '3일 후', offset: 3 },
  { label: '1주일', offset: 7 },
];

export function TodoModal({ visible, onSave, onClose }: Props) {
  const c = useThemeColors();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('mid');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  function reset() {
    setTitle('');
    setPriority('mid');
    setDueDate(null);
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), priority, dueDate });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const today = todayStr();
  const canSave = !!title.trim();

  return (
    <>
      <SheetModal
        visible={visible}
        onClose={handleClose}
        title="할 일 추가"
        footer={<SheetPrimaryButton label="추가" onPress={handleSave} disabled={!canSave} />}
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="할 일을 입력하세요"
          placeholderTextColor={c.inkDisabled}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
          style={{
            fontSize: 17,
            color: c.ink,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            paddingVertical: 8,
            marginBottom: 24,
          }}
        />

        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
          우선순위
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {PRIORITY_LABELS.map((opt) => {
            const selected = priority === opt.value;
            const color = getPriorityColor(opt.value, c);
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: selected ? color : c.border,
                  backgroundColor: selected ? `${color}18` : 'transparent',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color,
                    opacity: selected ? 1 : 0.3,
                  }}
                />
                <AppText
                  variant="caption"
                  style={{
                    color: selected ? color : c.inkTertiary,
                    fontWeight: selected ? '700' : '400',
                  }}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
          마감일
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {DUE_SHORTCUTS.map((s) => {
            const dateVal = shiftDate(today, s.offset);
            const selected = dueDate === dateVal;
            return (
              <Pressable
                key={s.label}
                onPress={() => setDueDate(selected ? null : dateVal)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: selected ? c.ink : c.border,
                  backgroundColor: selected ? c.surfaceSubtle : 'transparent',
                }}
              >
                <AppText
                  variant="caption"
                  tone={selected ? 'primary' : 'tertiary'}
                  style={selected ? { fontWeight: '700' } : {}}
                >
                  {s.label}
                </AppText>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setDatePickerVisible(true)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <AppText variant="caption" tone="tertiary">
              직접 선택
            </AppText>
          </Pressable>
        </View>

        {dueDate && (
          <AppText variant="caption" tone="secondary">
            {formatDueDate(dueDate)} 마감
          </AppText>
        )}
      </SheetModal>

      <DatePickerModal
        visible={datePickerVisible}
        value={dueDate}
        minimumDate={today}
        onConfirm={(date) => {
          setDueDate(date);
          setDatePickerVisible(false);
        }}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
}
