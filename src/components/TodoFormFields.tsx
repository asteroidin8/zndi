import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { type TodoPriority, useTodoStore } from '@/stores/useTodoStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPriorityColor } from '@/utils/dateFormat';

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'mid', label: '보통' },
  { value: 'low', label: '낮음' },
];

const DUE_SHORTCUTS = [
  { label: '오늘', offset: 0 },
  { label: '내일', offset: 1 },
  { label: '3일 후', offset: 3 },
  { label: '1주일', offset: 7 },
];

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function shiftDate(base: string, days: number) {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDueDate(s: string) {
  const [, m, d] = s.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}) {
  const c = useThemeColors();
  const borderColor = selected ? (color ?? c.ink) : c.border;
  const bg = selected ? (color ? `${color}18` : c.surfaceSubtle) : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: spacing.item,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor,
        backgroundColor: bg,
        alignItems: 'center',
      }}
    >
      <AppText
        variant="caption"
        style={{
          color: selected ? (color ?? c.ink) : c.inkTertiary,
          fontWeight: selected ? '700' : '400',
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

type Props = {
  title: string;
  onTitleChange: (text: string) => void;
  priority: TodoPriority;
  onPriorityChange: (p: TodoPriority) => void;
  dueDate: string | null;
  onDueDateChange: (d: string | null) => void;
  groupId: string | null;
  onGroupIdChange: (id: string | null) => void;
  onDatePickerOpen: () => void;
  onSubmit: () => void;
};

export function TodoFormFields({
  title,
  onTitleChange,
  priority,
  onPriorityChange,
  dueDate,
  onDueDateChange,
  groupId,
  onGroupIdChange,
  onDatePickerOpen,
  onSubmit,
}: Props) {
  const c = useThemeColors();
  const { groups } = useTodoStore();

  const today = todayStr();
  const shortcutDates = DUE_SHORTCUTS.map((s) => shiftDate(today, s.offset));
  const isCustomDate = dueDate !== null && !shortcutDates.includes(dueDate);

  return (
    <View style={{ gap: spacing.section }}>
      {/* 제목 */}
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="할 일을 입력하세요"
        placeholderTextColor={c.inkDisabled}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        style={{
          fontSize: 16,
          color: c.ink,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          paddingVertical: spacing.sm,
        }}
      />

      {/* 우선순위 */}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" tone="tertiary">우선순위</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {PRIORITY_OPTIONS.map((opt) => {
            const selected = priority === opt.value;
            const color = getPriorityColor(opt.value, c);
            return (
              <Pressable
                key={opt.value}
                onPress={() => onPriorityChange(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: selected ? color : c.border,
                  backgroundColor: selected ? `${color}18` : 'transparent',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color,
                    opacity: selected ? 1 : 0.3,
                  }}
                />
                <AppText
                  variant="caption"
                  style={{
                    color: selected ? color : c.inkTertiary,
                    fontWeight: selected ? '700' : '400',
                  }}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 그룹 */}
      {groups.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="tertiary">그룹</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Chip label="없음" selected={groupId === null} onPress={() => onGroupIdChange(null)} />
              {groups.map((g) => (
                <Chip
                  key={g.id}
                  label={g.name}
                  selected={groupId === g.id}
                  onPress={() => onGroupIdChange(groupId === g.id ? null : g.id)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 마감일 */}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" tone="tertiary">마감일</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {DUE_SHORTCUTS.map((s) => {
            const dateVal = shiftDate(today, s.offset);
            const selected = dueDate === dateVal;
            return (
              <Chip
                key={s.label}
                label={s.label}
                selected={selected}
                onPress={() => onDueDateChange(selected ? null : dateVal)}
              />
            );
          })}
          <Chip
            label={isCustomDate && dueDate ? formatDueDate(dueDate) : '직접 선택'}
            selected={isCustomDate}
            onPress={() => { Keyboard.dismiss(); onDatePickerOpen(); }}
          />
        </View>
      </View>
    </View>
  );
}
