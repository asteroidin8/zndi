import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { Divider } from './Divider';
import { type TodoPriority } from '@/stores/useTodoStore';
import { useThemeColors } from '@/hooks/useThemeColors';

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

const PRIORITY_OPTIONS: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'high', label: '높음', color: '#EF4444' },
  { value: 'mid', label: '보통', color: '#F59E0B' },
  { value: 'low', label: '낮음', color: '#6B7280' },
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={handleClose}
        />
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
              marginBottom: 20,
            }}
          />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* 제목 */}
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

            {/* 우선순위 */}
            <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
              우선순위
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {PRIORITY_OPTIONS.map((opt) => {
                const selected = priority === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPriority(opt.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selected ? opt.color : c.border,
                      backgroundColor: selected ? opt.color + '18' : 'transparent',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: opt.color,
                        opacity: selected ? 1 : 0.3,
                      }}
                    />
                    <AppText
                      variant="caption"
                      style={{
                        color: selected ? opt.color : c.inkTertiary,
                        fontWeight: selected ? '700' : '400',
                      }}
                    >
                      {opt.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* 마감일 */}
            <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
              마감일
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {DUE_SHORTCUTS.map((s) => {
                const dateVal = shiftDate(today, s.offset);
                const selected = dueDate === dateVal;
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => setDueDate(selected ? null : dateVal)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: selected ? c.ink : c.border,
                      backgroundColor: selected ? c.surfaceSubtle : 'transparent',
                      alignItems: 'center',
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
            </View>
            {dueDate && (
              <AppText
                variant="caption"
                tone="secondary"
                style={{ textAlign: 'center', marginBottom: 4 }}
              >
                {formatDueDate(dueDate)} 마감
              </AppText>
            )}

            <Divider spacing={8} />

            {/* 추가 버튼 */}
            <Pressable
              onPress={handleSave}
              disabled={!title.trim()}
              style={{
                backgroundColor: title.trim() ? c.ink : c.surfaceMuted,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <AppText
                variant="body"
                style={{
                  color: title.trim() ? c.surface : c.inkDisabled,
                  fontWeight: '700',
                }}
              >
                추가
              </AppText>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
