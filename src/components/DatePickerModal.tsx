/**
 * 네이티브 모듈 없이 WheelPicker를 조합한 날짜 선택 모달
 * 연도·월·일 세 개의 휠을 나란히 표시
 */
import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { useThemeColors } from '@/hooks/useThemeColors';

const ITEM_H = 44;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ── 단일 드럼 휠 ──────────────────────────────────────────────
function Drum({
  items,
  selected,
  onSelect,
  width,
}: {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
  width: number;
}) {
  const c = useThemeColors();
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = items.findIndex((it) => it.value === selected);
    if (idx >= 0) {
      ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
    }
  }, [selected, items]);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onSelect(items[clamped].value);
    ref.current?.scrollTo({ y: clamped * ITEM_H, animated: true });
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onSelect(items[clamped].value);
  }

  return (
    <View style={{ width, position: 'relative', height: ITEM_H * VISIBLE }}>
      {/* 선택 하이라이트 */}
      <View
        style={{
          position: 'absolute',
          top: ITEM_H * CENTER,
          left: 2,
          right: 2,
          height: ITEM_H,
          backgroundColor: c.surfaceSubtle,
          borderRadius: 10,
        }}
        pointerEvents="none"
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{
          paddingTop: ITEM_H * CENTER,
          paddingBottom: ITEM_H * CENTER,
        }}
      >
        {items.map((it) => {
          const isCenter = it.value === selected;
          return (
            <View
              key={it.value}
              style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }}
            >
              <AppText
                variant="body"
                tone={isCenter ? 'primary' : 'disabled'}
                style={isCenter ? { fontWeight: '700', fontSize: 18 } : { fontSize: 15 }}
              >
                {it.label}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── 메인 모달 ──────────────────────────────────────────────────
type Props = {
  visible: boolean;
  value: string | null; // 'YYYY-MM-DD'
  minimumDate?: string; // 'YYYY-MM-DD'
  onConfirm: (date: string) => void;
  onClose: () => void;
};

export function DatePickerModal({ visible, value, minimumDate, onConfirm, onClose }: Props) {
  const now = new Date();

  const minYear = minimumDate ? parseInt(minimumDate.slice(0, 4)) : now.getFullYear();
  const maxYear = now.getFullYear() + 2;

  const [year, setYear] = useState(() => {
    if (value) return parseInt(value.slice(0, 4));
    return now.getFullYear();
  });
  const [month, setMonth] = useState(() => {
    if (value) return parseInt(value.slice(5, 7));
    return now.getMonth() + 1;
  });
  const [day, setDay] = useState(() => {
    if (value) return parseInt(value.slice(8, 10));
    return now.getDate();
  });

  useEffect(() => {
    if (visible) {
      if (value) {
        setYear(parseInt(value.slice(0, 4)));
        setMonth(parseInt(value.slice(5, 7)));
        setDay(parseInt(value.slice(8, 10)));
      } else {
        setYear(now.getFullYear());
        setMonth(now.getMonth() + 1);
        setDay(now.getDate());
      }
    }
  }, [visible, value]);

  // 월이 바뀌면 day를 해당 월 범위로 클램프
  const daysInMonth = getDaysInMonth(year, month);
  const clampedDay = Math.min(day, daysInMonth);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
    value: minYear + i,
    label: `${minYear + i}년`,
  }));
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}월`,
  }));
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}일`,
  }));

  function handleConfirm() {
    const d = Math.min(day, daysInMonth);
    onConfirm(`${year}-${pad(month)}-${pad(d)}`);
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="날짜 선택"
      footer={<SheetPrimaryButton label="확인" onPress={handleConfirm} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Drum items={years} selected={year} onSelect={setYear} width={90} />
        <Drum items={months} selected={month} onSelect={setMonth} width={70} />
        <Drum items={days} selected={clampedDay} onSelect={setDay} width={70} />
      </View>
    </SheetModal>
  );
}
