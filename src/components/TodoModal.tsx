import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  onSave: (title: string) => void;
  onClose: () => void;
};

export function TodoModal({ visible, onSave, onClose }: Props) {
  const c = useThemeColors();
  const [title, setTitle] = useState('');

  function handleSave() {
    if (!title.trim()) return;
    onSave(title.trim());
    setTitle('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="할 일을 입력하세요"
          placeholderTextColor={c.inkDisabled}
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
          style={{
            fontSize: 16,
            color: c.ink,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            paddingVertical: 8,
            marginBottom: 20,
          }}
        />

        <Pressable
          onPress={handleSave}
          disabled={!title.trim()}
          style={{
            backgroundColor: title.trim() ? c.ink : c.surfaceMuted,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <AppText
            variant="body"
            style={{ color: title.trim() ? c.surface : c.inkDisabled, fontWeight: '600' }}
          >
            추가
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
}
