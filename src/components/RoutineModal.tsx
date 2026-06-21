import { useEffect, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { SheetDangerButton, SheetModal, SheetPrimaryButton } from './SheetModal';
import { TimePickerModal } from './TimePickerModal';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { RepeatType, Routine, Weekday } from '@/types';
import { formatTimeDisplay } from '@/utils/dateFormat';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const PRESET_OPTIONS: { type: RepeatType; label: string }[] = [
  { type: 'daily', label: '매일' },
  { type: 'weekly', label: '매주' },
  { type: 'monthly', label: '매월' },
];

type SavePayload = {
  name: string;
  repeatType: RepeatType;
  repeatDays: Weekday[];
  monthDates: number[];
  reminderTime: string | null;
  groupId: string | null;
};

type Props = {
  visible: boolean;
  initial?: Partial<Routine>;
  onSave: (data: SavePayload) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function RoutineModal({ visible, initial, onSave, onDelete, onClose }: Props) {
  const c = useThemeColors();
  const { groups } = useRoutineStore();
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');
  const [name, setName] = useState(initial?.name ?? '');
  const [repeatType, setRepeatType] = useState<RepeatType>(initial?.repeatType ?? 'weekly');
  const [days, setDays] = useState<Weekday[]>(initial?.repeatDays ?? [1, 2, 3, 4, 5]);
  const [monthDates, setMonthDates] = useState<number[]>(initial?.monthDates ?? []);
  const [reminderTime, setReminderTime] = useState<string | null>(initial?.reminderTime ?? null);
  const [groupId, setGroupId] = useState<string | null>(initial?.groupId ?? null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setRepeatType(initial?.repeatType ?? 'weekly');
    setDays(initial?.repeatDays ?? [1, 2, 3, 4, 5]);
    setMonthDates(initial?.monthDates ?? []);
    setReminderTime(initial?.reminderTime ?? null);
    setGroupId(initial?.groupId ?? null);
  }, [visible, initial]);

  function toggleDay(day: Weekday) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  function toggleMonthDate(date: number) {
    setMonthDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort((a, b) => a - b),
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    const finalDays = repeatType === 'daily' ? ALL_DAYS.slice() : days;
    onSave({ name: name.trim(), repeatType, repeatDays: finalDays, monthDates, reminderTime, groupId });
    setName('');
    setRepeatType('weekly');
    setDays([1, 2, 3, 4, 5]);
    setMonthDates([]);
    setReminderTime(null);
    setGroupId(null);
  }

  const canSave = !!name.trim() && (repeatType !== 'monthly' || monthDates.length > 0);

  const chipStyle = (selected: boolean) => ({
    paddingHorizontal: spacing.item,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: selected ? c.ink : c.border,
    backgroundColor: selected ? c.surfaceSubtle : 'transparent' as const,
    alignItems: 'center' as const,
  });

  const chipTextStyle = (selected: boolean) => ({
    color: selected ? c.ink : c.inkTertiary,
    fontWeight: selected ? '700' as const : '400' as const,
  });

  return (
    <>
      <SheetModal
        visible={visible}
        onClose={onClose}
        title={initial?.id ? '루틴 편집' : '루틴 추가'}
        footer={
          <>
            <SheetPrimaryButton label="저장" onPress={handleSave} disabled={!canSave} />
            {onDelete ? <SheetDangerButton label="삭제" onPress={onDelete} /> : null}
          </>
        }
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="되고 싶은 내 모습을 입력해보세요"
          placeholderTextColor={c.inkDisabled}
          autoFocus
          style={{
            fontSize: 16,
            color: c.ink,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            paddingVertical: spacing.sm,
            marginBottom: spacing.section,
          }}
        />

        <AppText variant="caption" tone="tertiary" style={{ marginBottom: spacing.sm }}>
          반복
        </AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.card }}>
          {PRESET_OPTIONS.map((opt) => (
            <Pressable
              key={opt.type}
              onPress={() => setRepeatType(opt.type)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: repeatType === opt.type ? c.ink : c.border,
                backgroundColor: repeatType === opt.type ? c.surfaceSubtle : 'transparent',
                alignItems: 'center',
              }}
            >
              <AppText
                variant="caption"
                style={{
                  color: repeatType === opt.type ? c.ink : c.inkTertiary,
                  fontWeight: repeatType === opt.type ? '700' : '400',
                }}
              >
                {opt.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {repeatType === 'weekly' && (
          <>
            <AppText variant="caption" tone="tertiary" style={{ marginBottom: spacing.sm }}>
              반복 요일
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.section }}>
              {ALL_DAYS.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: spacing.sm,
                    borderWidth: 1,
                    borderColor: days.includes(day) ? c.ink : c.border,
                    backgroundColor: days.includes(day) ? c.surfaceSubtle : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <AppText
                    variant="caption"
                    tone={days.includes(day) ? 'primary' : 'tertiary'}
                    style={days.includes(day) ? { fontWeight: '700' } : {}}
                  >
                    {DAY_LABELS[day]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {repeatType === 'monthly' && (
          <>
            <AppText variant="caption" tone="tertiary" style={{ marginBottom: spacing.sm }}>
              반복 날짜
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.section }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                <Pressable
                  key={date}
                  onPress={() => toggleMonthDate(date)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: monthDates.includes(date) ? c.ink : c.border,
                    backgroundColor: monthDates.includes(date) ? c.surfaceSubtle : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color: monthDates.includes(date) ? c.ink : c.inkTertiary,
                      fontWeight: monthDates.includes(date) ? '700' : '400',
                    }}
                  >
                    {date}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {groups.length > 0 && (
          <>
            <AppText variant="caption" tone="tertiary" style={{ marginBottom: spacing.sm }}>
              그룹
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              style={{ marginBottom: spacing.section }}
            >
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable onPress={() => setGroupId(null)} style={chipStyle(groupId === null)}>
                  <AppText variant="caption" style={chipTextStyle(groupId === null)}>없음</AppText>
                </Pressable>
                {groups.map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => setGroupId(groupId === g.id ? null : g.id)}
                    style={chipStyle(groupId === g.id)}
                  >
                    <AppText variant="caption" style={chipTextStyle(groupId === g.id)}>
                      {g.name}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <AppText variant="caption" tone="tertiary" style={{ marginBottom: spacing.sm }}>
          알림
        </AppText>
        <Pressable
          onPress={() => { Keyboard.dismiss(); setTimePickerVisible(true); }}
          accessibilityRole="button"
          accessibilityLabel={reminderTime ? `알림 시간 ${reminderTime}` : '알림 없음'}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
          }}
        >
          <AppText variant="body">알림 시간</AppText>
          <AppText variant="body" tone={reminderTime ? 'secondary' : 'tertiary'}>
            {reminderTime ? formatTimeDisplay(reminderTime, timeFormat) : '없음'}
          </AppText>
        </Pressable>
      </SheetModal>

      <TimePickerModal
        visible={timePickerVisible}
        selectedTime={reminderTime}
        title="루틴 알림 시간"
        onConfirm={(time) => {
          setReminderTime(time);
          setTimePickerVisible(false);
        }}
        onClose={() => setTimePickerVisible(false)}
      />
    </>
  );
}
