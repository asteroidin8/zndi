import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { DrumPicker } from './DrumPicker';
import { SheetModal, SheetPrimaryButton } from './SheetModal';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

type Props = {
  visible: boolean;
  value: string | null;
  minimumDate?: string;
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
      scrollable={false}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <DrumPicker items={years} selected={year} onSelect={setYear} width={90} />
        <DrumPicker items={months} selected={month} onSelect={setMonth} width={70} />
        <DrumPicker items={days} selected={clampedDay} onSelect={setDay} width={70} />
      </View>
    </SheetModal>
  );
}
