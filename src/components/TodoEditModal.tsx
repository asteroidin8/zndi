import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { Divider } from './Divider';
import { type Todo, type TodoPriority } from '@/stores/useTodoStore';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  todo: Todo | null;
  onSave: (updates: Pick<Todo, 'title' | 'priority'>) => void;
  onDelete: () => void;
  onClose: () => void;
};

const PRIORITY_OPTIONS: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'high', label: '높음', color: '#EF4444' },
  { value: 'mid', label: '보통', color: '#F59E0B' },
  { value: 'low', label: '낮음', color: '#6B7280' },
];

export function TodoEditModal({ visible, todo, onSave, onDelete, onClose }: Props) {
  const c = useThemeColors();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('mid');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setPriority(todo.priority);
    }
  }, [todo]);

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), priority });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={onClose}
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

          <AppText variant="body" style={{ fontWeight: '700', marginBottom: 14 }}>
            할 일 편집
          </AppText>

          {/* 제목 입력 */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="할 일을 입력하세요"
            placeholderTextColor={c.inkDisabled}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            style={{
              fontSize: 16,
              color: c.ink,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
              paddingVertical: 8,
              marginBottom: 20,
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
                      opacity: selected ? 1 : 0.35,
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

          {/* 저장 버튼 */}
          <Pressable
            onPress={handleSave}
            disabled={!title.trim()}
            style={{
              backgroundColor: title.trim() ? c.ink : c.surfaceMuted,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <AppText
              variant="body"
              style={{
                color: title.trim() ? c.surface : c.inkDisabled,
                fontWeight: '700',
              }}
            >
              저장
            </AppText>
          </Pressable>

          <Divider />

          {/* 삭제 버튼 */}
          <Pressable
            onPress={onDelete}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <AppText variant="body" style={{ color: '#EF4444' }}>
              삭제
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
