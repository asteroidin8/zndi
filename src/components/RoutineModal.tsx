import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { SheetDangerButton, SheetModal, SheetPrimaryButton } from './SheetModal';
import { TimePickerModal } from './TimePickerModal';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineStore } from '@/stores/useRoutineStore';
import type { Routine, Weekday } from '@/types';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

type SavePayload = {
  name: string;
  repeatDays: Weekday[];
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
  const [name, setName] = useState(initial?.name ?? '');
  const [days, setDays] = useState<Weekday[]>(initial?.repeatDays ?? [1, 2, 3, 4, 5]);
  const [reminderTime, setReminderTime] = useState<string | null>(initial?.reminderTime ?? null);
  const [groupId, setGroupId] = useState<string | null>(initial?.groupId ?? null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setDays(initial?.repeatDays ?? [1, 2, 3, 4, 5]);
    setReminderTime(initial?.reminderTime ?? null);
    setGroupId(initial?.groupId ?? null);
  }, [visible, initial]);

  function toggleDay(day: Weekday) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), repeatDays: days, reminderTime, groupId });
    setName('');
    setDays([1, 2, 3, 4, 5]);
    setReminderTime(null);
    setGroupId(null);
  }

  const canSave = !!name.trim();

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
                <Pressable
                  onPress={() => setGroupId(null)}
                  style={{
                    paddingHorizontal: spacing.item,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: groupId === null ? c.ink : c.border,
                    backgroundColor: groupId === null ? c.surfaceSubtle : 'transparent',
                  }}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color: groupId === null ? c.ink : c.inkTertiary,
                      fontWeight: groupId === null ? '700' : '400',
                    }}
                  >
                    없음
                  </AppText>
                </Pressable>
                {groups.map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => setGroupId(groupId === g.id ? null : g.id)}
                    style={{
                      paddingHorizontal: spacing.item,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: groupId === g.id ? c.ink : c.border,
                      backgroundColor: groupId === g.id ? c.surfaceSubtle : 'transparent',
                    }}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: groupId === g.id ? c.ink : c.inkTertiary,
                        fontWeight: groupId === g.id ? '700' : '400',
                      }}
                    >
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
          onPress={() => setTimePickerVisible(true)}
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
            {reminderTime ?? '없음'}
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
