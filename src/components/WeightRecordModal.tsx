import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { DecimalWheelPicker } from './settings/DecimalWheelPicker';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { localDateStr } from '@/utils/dateFormat';

type Props = {
  visible: boolean;
  initialWeight: number;
  onSave: (date: string, weightKg: number) => void;
  onClose: () => void;
};

function formatDateKr(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return localDateStr(date);
}

export function WeightRecordModal({ visible, initialWeight, onSave, onClose }: Props) {
  const c = useThemeColors();
  const [date, setDate] = useState(localDateStr());
  const [weight, setWeight] = useState(initialWeight);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDate(localDateStr());
    setWeight(initialWeight);
  }, [visible, initialWeight]);

  const isFuture = date > localDateStr();

  return (
    <>
      <SheetModal
        visible={visible && !pickerVisible}
        onClose={onClose}
        title="체중 기록"
        footer={
          <SheetPrimaryButton
            label="저장"
            onPress={() => onSave(date, weight)}
            disabled={isFuture}
          />
        }
      >
        <View style={{ gap: spacing.section }}>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="tertiary">날짜</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Pressable
                onPress={() => setDate(addDays(date, -1))}
                hitSlop={8}
                style={{ padding: 8 }}
              >
                <AppText variant="body" tone="secondary">◀</AppText>
              </Pressable>
              <AppText variant="body" style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
                {formatDateKr(date)}
              </AppText>
              <Pressable
                onPress={() => {
                  const next = addDays(date, 1);
                  if (next <= localDateStr()) setDate(next);
                }}
                hitSlop={8}
                style={{ padding: 8, opacity: addDays(date, 1) > localDateStr() ? 0.3 : 1 }}
                disabled={addDays(date, 1) > localDateStr()}
              >
                <AppText variant="body" tone="secondary">▶</AppText>
              </Pressable>
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="tertiary">체중</AppText>
            <Pressable
              onPress={() => setPickerVisible(true)}
              style={{
                paddingVertical: spacing.md,
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: c.surfaceSubtle,
              }}
            >
              <AppText variant="title" style={{ fontSize: 28, fontWeight: '700' }}>
                {weight.toFixed(1)} kg
              </AppText>
            </Pressable>
          </View>
        </View>
      </SheetModal>

      <DecimalWheelPicker
        visible={pickerVisible}
        min={30}
        max={180}
        selectedValue={weight}
        unit="kg"
        title="체중 선택"
        onConfirm={(value) => {
          setWeight(value);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}
