import { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const CENTER_INDEX = Math.floor(VISIBLE_COUNT / 2);

export type DrumItem = { value: number; label: string };

type Props = {
  items: DrumItem[];
  selected: number;
  onSelect: (value: number) => void;
  width?: number;
};

export function DrumPicker({ items, selected, onSelect, width }: Props) {
  const c = useThemeColors();
  const ref = useRef<ScrollView>(null);
  const isProgrammatic = useRef(false);

  function scrollToIndex(idx: number, animated = false) {
    isProgrammatic.current = true;
    ref.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated });
    setTimeout(() => {
      isProgrammatic.current = false;
    }, animated ? 400 : 50);
  }

  useEffect(() => {
    const idx = items.findIndex((it) => it.value === selected);
    if (idx >= 0) scrollToIndex(idx, false);
  }, [selected, items]);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onSelect(items[clamped].value);
    scrollToIndex(clamped, true);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onSelect(items[clamped].value);
  }

  return (
    <View style={{ width, position: 'relative', height: ITEM_HEIGHT * VISIBLE_COUNT, ...(width ? {} : { flex: 1 }) }}>
      <View
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * CENTER_INDEX,
          left: 2,
          right: 2,
          height: ITEM_HEIGHT,
          backgroundColor: c.surfaceSubtle,
          borderRadius: 10,
        }}
        pointerEvents="none"
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * CENTER_INDEX,
          paddingBottom: ITEM_HEIGHT * CENTER_INDEX,
        }}
      >
        {items.map((it) => {
          const isCenter = it.value === selected;
          return (
            <View
              key={it.value}
              style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
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

export { ITEM_HEIGHT as DRUM_ITEM_HEIGHT };
