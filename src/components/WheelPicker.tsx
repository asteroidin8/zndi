import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { Divider } from './Divider';
import { useThemeColors } from '@/hooks/useThemeColors';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

type Props = {
  visible: boolean;
  values: number[];
  selectedValue: number;
  unit?: string;
  title?: string;
  onConfirm: (value: number) => void;
  onClose: () => void;
};

export function WheelPicker({
  visible,
  values,
  selectedValue,
  unit,
  title,
  onConfirm,
  onClose,
}: Props) {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [selected, setSelected] = useState(selectedValue);
  const [editingText, setEditingText] = useState<string | null>(null);

  // 프로그래매틱 스크롤 중에는 scroll 이벤트를 무시하기 위한 플래그
  const isProgrammatic = useRef(false);
  // handleConfirm 시 최신 selected 값을 즉시 참조하기 위한 ref
  const selectedRef = useRef(selectedValue);

  function scrollToIndex(idx: number, animated = false) {
    isProgrammatic.current = true;
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated });
    // animated: false는 즉시 완료되므로 짧은 timeout으로 플래그 해제
    setTimeout(() => { isProgrammatic.current = false; }, animated ? 400 : 50);
  }

  useEffect(() => {
    if (visible) {
      setSelected(selectedValue);
      selectedRef.current = selectedValue;
      setEditingText(null);
      setTimeout(() => {
        const idx = values.indexOf(selectedValue);
        if (idx >= 0) scrollToIndex(idx, false);
      }, 100);
    }
  }, [visible, selectedValue, values]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    setSelected(values[clamped]);
    selectedRef.current = values[clamped];
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    setSelected(values[clamped]);
    selectedRef.current = values[clamped];
    // snap 보정은 animated: false — 다시 이벤트를 유발하지 않음
    scrollToIndex(clamped, false);
  }

  function handleCenterTap() {
    setEditingText(String(selected));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleTextChange(text: string) {
    setEditingText(text.replace(/[^0-9]/g, ''));
  }

  function commitTextEdit() {
    if (editingText === null) return;
    const parsed = parseInt(editingText, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const closest = values.reduce((prev, curr) =>
        Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev,
      );
      setSelected(closest);
      selectedRef.current = closest;
      scrollToIndex(values.indexOf(closest), false);
    }
    setEditingText(null);
  }

  function handleConfirm() {
    if (editingText !== null) {
      // 텍스트 편집 중 확인: ref에서 즉시 값 읽기
      const parsed = parseInt(editingText, 10);
      if (!isNaN(parsed) && parsed > 0) {
        const closest = values.reduce((prev, curr) =>
          Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev,
        );
        selectedRef.current = closest;
      }
      setEditingText(null);
    }
    onConfirm(selectedRef.current);
  }

  const centerIdx = Math.floor(VISIBLE_ITEMS / 2);

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

          <AppText variant="title" style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            {title}
          </AppText>

          <Divider />

          {/* 휠 */}
          <View style={{ position: 'relative', height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
            {/* 선택 하이라이트 */}
            <View
              style={{
                position: 'absolute',
                top: ITEM_HEIGHT * centerIdx,
                left: 20,
                right: 20,
                height: ITEM_HEIGHT,
                backgroundColor: c.surfaceSubtle,
                borderRadius: 12,
              }}
              pointerEvents="none"
            />

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={32}
              onMomentumScrollEnd={handleMomentumEnd}
              contentContainerStyle={{
                paddingTop: ITEM_HEIGHT * centerIdx,
                paddingBottom: ITEM_HEIGHT * centerIdx,
              }}
            >
              {values.map((v, i) => {
                const isCenter = v === selected;
                return (
                  <Pressable
                    key={v}
                    style={{
                      height: ITEM_HEIGHT,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      if (isCenter) {
                        handleCenterTap();
                      } else {
                        setSelected(v);
                        selectedRef.current = v;
                        scrollToIndex(i, true);
                      }
                    }}
                  >
                    {isCenter && editingText !== null ? (
                      <TextInput
                        ref={inputRef}
                        value={editingText}
                        onChangeText={handleTextChange}
                        onBlur={commitTextEdit}
                        onSubmitEditing={commitTextEdit}
                        keyboardType="numeric"
                        returnKeyType="done"
                        style={{
                          fontSize: 20,
                          fontWeight: '600',
                          color: c.ink,
                          textAlign: 'center',
                          minWidth: 60,
                          borderBottomWidth: 1.5,
                          borderBottomColor: c.ink,
                          paddingVertical: 2,
                        }}
                      />
                    ) : (
                      <AppText
                        variant="body"
                        tone={isCenter ? 'primary' : 'disabled'}
                        style={isCenter ? { fontWeight: '700', fontSize: 20 } : { fontSize: 16 }}
                      >
                        {v}
                        {unit ? ` ${unit}` : ''}
                      </AppText>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 확인 버튼 */}
          <Pressable
            onPress={handleConfirm}
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: c.ink,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
              확인
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
