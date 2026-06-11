import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { Divider } from './Divider';
import { useThemeColors } from '@/hooks/useThemeColors';

const ITEM_HEIGHT = 44;
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

export function WheelPicker({ visible, values, selectedValue, unit, title, onConfirm, onClose }: Props) {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(selectedValue);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textValue, setTextValue] = useState(String(selectedValue));

  const selectedIndex = values.indexOf(selected);

  useEffect(() => {
    if (visible) {
      setSelected(selectedValue);
      setTextValue(String(selectedValue));
      setIsTextMode(false);
      setTimeout(() => {
        const idx = values.indexOf(selectedValue);
        if (idx >= 0) {
          scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
        }
      }, 100);
    }
  }, [visible, selectedValue, values]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    setSelected(values[clamped]);
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    setSelected(values[clamped]);
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  }

  function handleConfirm() {
    if (isTextMode) {
      const parsed = parseInt(textValue, 10);
      if (!isNaN(parsed) && values.includes(parsed)) {
        onConfirm(parsed);
      } else if (!isNaN(parsed)) {
        const closest = values.reduce((prev, curr) =>
          Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev,
        );
        onConfirm(closest);
      }
    } else {
      onConfirm(selected);
    }
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

        {/* 타이틀 + 직접입력 토글 */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <AppText variant="title">{title}</AppText>
          <Pressable onPress={() => setIsTextMode((v) => !v)} hitSlop={8}>
            <AppText variant="caption" tone="secondary">
              {isTextMode ? '휠로 선택' : '직접 입력'}
            </AppText>
          </Pressable>
        </View>

        <Divider />

        {isTextMode ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' }}>
            <TextInput
              value={textValue}
              onChangeText={setTextValue}
              keyboardType="numeric"
              autoFocus
              style={{
                fontSize: 40,
                fontWeight: '300',
                color: c.ink,
                textAlign: 'center',
                borderBottomWidth: 1,
                borderBottomColor: c.borderStrong,
                width: 120,
                paddingVertical: 4,
              }}
            />
            {unit ? (
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 8 }}>
                {unit}
              </AppText>
            ) : null}
          </View>
        ) : (
          <View style={{ position: 'relative', height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
            {/* 선택 영역 하이라이트 */}
            <View
              style={{
                position: 'absolute',
                top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                backgroundColor: c.surfaceSubtle,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: c.border,
              }}
              pointerEvents="none"
            />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleMomentumEnd}
              contentContainerStyle={{
                paddingTop: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                paddingBottom: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
              }}
            >
              {values.map((v) => (
                <Pressable
                  key={v}
                  style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => {
                    const idx = values.indexOf(v);
                    setSelected(v);
                    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                  }}
                >
                  <AppText
                    variant="body"
                    tone={v === selected ? 'primary' : 'disabled'}
                    style={v === selected ? { fontWeight: '600' } : {}}
                  >
                    {v}
                    {unit ? ` ${unit}` : ''}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 확인 버튼 */}
        <Pressable
          onPress={handleConfirm}
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            backgroundColor: c.ink,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <AppText variant="body" style={{ color: c.surface, fontWeight: '600' }}>
            확인
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
}
