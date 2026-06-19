import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../AppText';
import { SheetModal, SheetPrimaryButton } from '../SheetModal';
import { useThemeColors } from '@/hooks/useThemeColors';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const DECIMALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type Props = {
  visible: boolean;
  min: number;
  max: number;
  selectedValue: number;
  unit?: string;
  title?: string;
  onConfirm: (value: number) => void;
  onClose: () => void;
};

export type PickerColumnHandle = {
  commitPendingEdit: () => void;
};

function splitValue(value: number) {
  const rounded = Math.round(value * 10) / 10;
  const intPart = Math.floor(rounded + 1e-9);
  const decPart = Math.round((rounded - intPart) * 10);
  return { intPart, decPart: Math.min(9, Math.max(0, decPart)) };
}

function combineValue(intPart: number, decPart: number) {
  return Math.round((intPart + decPart / 10) * 10) / 10;
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

type ColumnProps = {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  format: (value: number) => string;
  editable?: boolean;
  /** 직접 입력 허용 글자 (기본: 숫자만) */
  sanitizeInput?: (text: string) => string;
  parseInput?: (text: string) => number | null;
  clampInput?: (value: number) => number;
  inputWidth?: number;
};

const PickerColumn = forwardRef<PickerColumnHandle, ColumnProps>(function PickerColumn(
  {
    values,
    selected,
    onSelect,
    format,
    editable = false,
    sanitizeInput = (text) => text.replace(/[^0-9]/g, ''),
    parseInput = (text) => {
      const parsed = parseInt(text, 10);
      return Number.isNaN(parsed) ? null : parsed;
    },
    clampInput = (value) => value,
    inputWidth = 60,
  },
  ref,
) {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const isProgrammatic = useRef(false);
  const selectedRef = useRef(selected);
  const [editingText, setEditingText] = useState<string | null>(null);
  const centerIdx = Math.floor(VISIBLE_ITEMS / 2);

  selectedRef.current = selected;

  function scrollToIndex(idx: number, animated = false) {
    isProgrammatic.current = true;
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated });
    setTimeout(() => {
      isProgrammatic.current = false;
    }, animated ? 400 : 50);
  }

  function commitTextEdit() {
    if (editingText === null) return;
    const parsed = parseInput(editingText);
    if (parsed !== null) {
      const clamped = clampInput(parsed);
      onSelect(clamped);
      selectedRef.current = clamped;
      const idx = values.indexOf(clamped);
      if (idx >= 0) scrollToIndex(idx, false);
    }
    setEditingText(null);
  }

  useImperativeHandle(ref, () => ({
    commitPendingEdit: commitTextEdit,
  }));

  useEffect(() => {
    if (editingText !== null) return;
    const idx = values.indexOf(selected);
    if (idx >= 0) scrollToIndex(idx, false);
  }, [selected, values, editingText]);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current || editingText !== null) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    onSelect(values[clamped]);
    selectedRef.current = values[clamped];
    scrollToIndex(clamped, false);
  }

  function handleCenterTap() {
    if (!editable) return;
    setEditingText(String(selected));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <View style={{ flex: 1, position: 'relative', height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <View
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * centerIdx,
          left: 0,
          right: 0,
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
        scrollEventThrottle={32}
        onMomentumScrollEnd={handleMomentumEnd}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={editingText === null}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * centerIdx,
          paddingBottom: ITEM_HEIGHT * centerIdx,
        }}
      >
        {values.map((value, index) => {
          const isCenter = value === selected;
          return (
            <Pressable
              key={`${value}-${index}`}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => {
                if (isCenter && editable) {
                  handleCenterTap();
                  return;
                }
                setEditingText(null);
                onSelect(value);
                selectedRef.current = value;
                scrollToIndex(index, true);
              }}
            >
              {isCenter && editingText !== null ? (
                <TextInput
                  ref={inputRef}
                  value={editingText}
                  onChangeText={(text) => setEditingText(sanitizeInput(text))}
                  onBlur={commitTextEdit}
                  onSubmitEditing={commitTextEdit}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  selectTextOnFocus
                  style={{
                    fontSize: 20,
                    fontWeight: '600',
                    color: c.ink,
                    textAlign: 'center',
                    width: inputWidth,
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
                  {format(value)}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

export function DecimalWheelPicker({
  visible,
  min,
  max,
  selectedValue,
  unit,
  title,
  onConfirm,
  onClose,
}: Props) {
  const minInt = Math.floor(min);
  const maxInt = Math.floor(max);
  const integerValues = Array.from({ length: maxInt - minInt + 1 }, (_, i) => minInt + i);

  const initial = splitValue(selectedValue);
  const [intPart, setIntPart] = useState(initial.intPart);
  const [decPart, setDecPart] = useState(initial.decPart);
  const intRef = useRef(initial.intPart);
  const decRef = useRef(initial.decPart);
  const intColumnRef = useRef<PickerColumnHandle>(null);
  const decColumnRef = useRef<PickerColumnHandle>(null);

  useEffect(() => {
    if (!visible) return;
    const next = splitValue(selectedValue);
    setIntPart(next.intPart);
    setDecPart(next.decPart);
    intRef.current = next.intPart;
    decRef.current = next.decPart;
  }, [visible, selectedValue]);

  function handleConfirm() {
    intColumnRef.current?.commitPendingEdit();
    decColumnRef.current?.commitPendingEdit();
    onConfirm(clampValue(combineValue(intRef.current, decRef.current), min, max));
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      footer={<SheetPrimaryButton label="확인" onPress={handleConfirm} />}
      scrollable={false}
    >
      <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center', marginBottom: 8 }}>
        숫자를 터치하면 직접 입력할 수 있어요
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: -4 }}>
        <PickerColumn
          key={`int-${visible}`}
          ref={intColumnRef}
          editable
          values={integerValues}
          selected={intPart}
          onSelect={(value) => {
            setIntPart(value);
            intRef.current = value;
          }}
          format={(value) => String(value)}
          clampInput={(value) => Math.min(maxInt, Math.max(minInt, value))}
          inputWidth={72}
        />
        <AppText variant="title" style={{ paddingBottom: 2 }}>
          .
        </AppText>
        <View style={{ width: 56 }}>
          <PickerColumn
            key={`dec-${visible}`}
            ref={decColumnRef}
            editable
            values={DECIMALS}
            selected={decPart}
            onSelect={(value) => {
              setDecPart(value);
              decRef.current = value;
            }}
            format={(value) => String(value)}
            sanitizeInput={(text) => text.replace(/[^0-9]/g, '').slice(0, 1)}
            parseInput={(text) => {
              if (text === '') return null;
              const parsed = parseInt(text, 10);
              if (Number.isNaN(parsed)) return null;
              return Math.min(9, Math.max(0, parsed));
            }}
            clampInput={(value) => Math.min(9, Math.max(0, value))}
            inputWidth={36}
          />
        </View>
        {unit && (
          <AppText variant="body" tone="tertiary" style={{ paddingBottom: 2, minWidth: 28 }}>
            {unit}
          </AppText>
        )}
      </View>
    </SheetModal>
  );
}
