import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { DrumPicker } from './DrumPicker';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { spacing } from '@/constants/spacing';

const HOURS = Array.from({ length: 18 }, (_, i) => ({
  value: i + 6,
  label: `${String(i + 6).padStart(2, '0')}시`,
}));

const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  label: `${String(i * 5).padStart(2, '0')}분`,
}));

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
        <DrumPicker items={HOURS} selected={hour} onSelect={setHour} />
        <DrumPicker items={MINUTES} selected={minute} onSelect={setMinute} />
      </View>
    </SheetModal>
  );
}
