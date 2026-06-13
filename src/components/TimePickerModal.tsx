import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

type Props = {
  visible: boolean;
  selectedTime: string | null;
  title?: string;
  onConfirm: (time: string | null) => void;
  onClose: () => void;
};

function parseTime(value: string | null) {
  if (!value) return { hour: 9, minute: 0 };
  const [hStr, mStr] = value.split(':');
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(6, hour)) : 9;
  const safeMinute = snapMinute(Number.isFinite(minute) ? minute : 0);
  return { hour: safeHour, minute: safeMinute };
}

function snapMinute(minute: number) {
  return Math.round(minute / 5) * 5;
}

function Drum({
  items,
  selected,
  onSelect,
  suffix,
}: {
  items: number[];
  selected: number;
  onSelect: (value: number) => void;
  suffix: string;
}) {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const isProgrammatic = useRef(false);

  function scrollToValue(value: number, animated = false) {
    const idx = items.indexOf(value);
    if (idx < 0) return;
    isProgrammatic.current = true;
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated });
    setTimeout(() => {
      isProgrammatic.current = false;
    }, animated ? 400 : 50);
  }

  useEffect(() => {
    scrollToValue(selected, false);
  }, [selected, items]);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onSelect(items[clamped]);
    scrollToValue(items[clamped], true);
  }

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((item) => {
          const active = item === selected;
          return (
            <View
              key={item}
              style={{
                height: ITEM_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText
                variant="body"
                style={{
                  fontWeight: active ? '700' : '400',
                  color: active ? c.ink : c.inkTertiary,
                }}
              >
                {String(item).padStart(2, '0')}
                {suffix}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimePickerModal({
  visible,
  selectedTime,
  title = '알림 시간',
  onConfirm,
  onClose,
}: Props) {
  const parsed = parseTime(selectedTime);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(snapMinute(parsed.minute));

  useEffect(() => {
    if (visible) {
      const next = parseTime(selectedTime);
      setHour(next.hour);
      setMinute(snapMinute(next.minute));
    }
  }, [visible, selectedTime]);

  function handleConfirm() {
    onConfirm(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }

  function handleClear() {
    onConfirm(null);
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <>
          <SheetPrimaryButton label="확인" onPress={handleConfirm} />
          <SheetPrimaryButton label="알림 없음" onPress={handleClear} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Drum items={HOURS} selected={hour} onSelect={setHour} suffix="시" />
        <Drum items={MINUTES} selected={minute} onSelect={setMinute} suffix="분" />
      </View>
    </SheetModal>
  );
}
