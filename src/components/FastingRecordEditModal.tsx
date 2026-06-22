import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { DrumPicker, type DrumItem } from './DrumPicker';
import { SheetDangerButton, SheetModal, SheetPrimaryButton } from './SheetModal';
import { appAlert } from '@/stores/useAlertStore';
import { type FastingRecord, type FastingResult } from '@/stores/useFastingStore';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  record: FastingRecord | null;
  onSave: (updates: Pick<FastingRecord, 'result' | 'startedAt' | 'endedAt'>) => void;
  onDelete: () => void;
  onClose: () => void;
};

function formatDatetime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  return `${d.getMonth() + 1}/${d.getDate()} ${ampm} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
}

function formatDuration(startedAt: number, endedAt: number | null) {
  if (!endedAt) return '-';
  const mins = Math.floor((endedAt - startedAt) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

const RESULT_OPTIONS: { value: FastingResult; label: string }[] = [
  { value: 'completed', label: '완료' },
  { value: 'abandoned', label: '중도 포기' },
];

type EditingField = 'start' | 'end' | null;

function buildMonthItems(): DrumItem[] {
  return Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}월` }));
}

function buildDayItems(year: number, month: number): DrumItem[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({ value: i + 1, label: `${i + 1}일` }));
}

const HOUR_ITEMS: DrumItem[] = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}시`,
}));

const MINUTE_ITEMS: DrumItem[] = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  label: `${String(i * 5).padStart(2, '0')}분`,
}));

function tsToFields(ts: number) {
  const d = new Date(ts);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: Math.round(d.getMinutes() / 5) * 5,
  };
}

function fieldsToTs(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(year, month, day, hour, minute).getTime();
}

export function FastingRecordEditModal({ visible, record, onSave, onDelete, onClose }: Props) {
  const c = useThemeColors();
  const [result, setResult] = useState<FastingResult>('completed');
  const [editingField, setEditingField] = useState<EditingField>(null);

  const [startFields, setStartFields] = useState({ year: 2026, month: 0, day: 1, hour: 0, minute: 0 });
  const [endFields, setEndFields] = useState({ year: 2026, month: 0, day: 1, hour: 0, minute: 0 });

  useEffect(() => {
    if (record) {
      setResult(record.result ?? 'completed');
      setStartFields(tsToFields(record.startedAt));
      if (record.endedAt) setEndFields(tsToFields(record.endedAt));
      setEditingField(null);
    }
  }, [record]);

  if (!record) return null;

  const editedStartTs = fieldsToTs(startFields.year, startFields.month, startFields.day, startFields.hour, startFields.minute);
  const editedEndTs = record.endedAt
    ? fieldsToTs(endFields.year, endFields.month, endFields.day, endFields.hour, endFields.minute)
    : null;

  const isStartChanged = editedStartTs !== record.startedAt;
  const isEndChanged = editedEndTs !== null && editedEndTs !== record.endedAt;
  const isResultChanged = result !== record.result;
  const hasChanges = isStartChanged || isEndChanged || isResultChanged;

  const isValid = editedEndTs === null || editedEndTs > editedStartTs;

  function handleSave() {
    if (!isValid) {
      appAlert('시간 오류', '종료 시간은 시작 시간보다 뒤여야 해요.');
      return;
    }
    onSave({
      result,
      startedAt: editedStartTs,
      endedAt: editedEndTs,
    });
  }

  function toggleEditing(field: EditingField) {
    setEditingField((prev) => (prev === field ? null : field));
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="단식 기록 편집"
      footer={
        <>
          <SheetPrimaryButton label="저장" onPress={handleSave} disabled={!hasChanges || !isValid} />
          <SheetDangerButton label="기록 삭제" onPress={onDelete} />
        </>
      }
    >
      <View
        style={{
          backgroundColor: c.surfaceSubtle,
          borderRadius: radius.md,
          overflow: 'hidden',
          marginBottom: spacing.card,
        }}
      >
        <Pressable
          onPress={() => toggleEditing('start')}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.item,
          }}
        >
          <AppText variant="caption" tone="tertiary">시작</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <AppText
              variant="caption"
              style={isStartChanged ? { color: c.primary, fontWeight: '600' } : {}}
            >
              {formatDatetime(editedStartTs)}
            </AppText>
            <AppIcon
              name={editingField === 'start' ? 'ChevronUp' : 'Pencil'}
              size={12}
              color={editingField === 'start' ? c.primary : c.inkTertiary}
            />
          </View>
        </Pressable>

        {editingField === 'start' && (
          <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
              <DrumPicker
                items={buildMonthItems()}
                selected={startFields.month}
                onSelect={(v) => setStartFields((p) => ({ ...p, month: v }))}
                width={64}
              />
              <DrumPicker
                items={buildDayItems(startFields.year, startFields.month)}
                selected={startFields.day}
                onSelect={(v) => setStartFields((p) => ({ ...p, day: v }))}
                width={56}
              />
              <DrumPicker
                items={HOUR_ITEMS}
                selected={startFields.hour}
                onSelect={(v) => setStartFields((p) => ({ ...p, hour: v }))}
                width={56}
              />
              <DrumPicker
                items={MINUTE_ITEMS}
                selected={startFields.minute}
                onSelect={(v) => setStartFields((p) => ({ ...p, minute: v }))}
                width={56}
              />
            </View>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: c.borderNeutral, marginLeft: spacing.item }} />

        {record.endedAt != null && (
          <>
            <Pressable
              onPress={() => toggleEditing('end')}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.item,
              }}
            >
              <AppText variant="caption" tone="tertiary">종료</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <AppText
                  variant="caption"
                  style={isEndChanged ? { color: c.primary, fontWeight: '600' } : {}}
                >
                  {formatDatetime(editedEndTs!)}
                </AppText>
                <AppIcon
                  name={editingField === 'end' ? 'ChevronUp' : 'Pencil'}
                  size={12}
                  color={editingField === 'end' ? c.primary : c.inkTertiary}
                />
              </View>
            </Pressable>

            {editingField === 'end' && (
              <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
                  <DrumPicker
                    items={buildMonthItems()}
                    selected={endFields.month}
                    onSelect={(v) => setEndFields((p) => ({ ...p, month: v }))}
                    width={64}
                  />
                  <DrumPicker
                    items={buildDayItems(endFields.year, endFields.month)}
                    selected={endFields.day}
                    onSelect={(v) => setEndFields((p) => ({ ...p, day: v }))}
                    width={56}
                  />
                  <DrumPicker
                    items={HOUR_ITEMS}
                    selected={endFields.hour}
                    onSelect={(v) => setEndFields((p) => ({ ...p, hour: v }))}
                    width={56}
                  />
                  <DrumPicker
                    items={MINUTE_ITEMS}
                    selected={endFields.minute}
                    onSelect={(v) => setEndFields((p) => ({ ...p, minute: v }))}
                    width={56}
                  />
                </View>
              </View>
            )}

            <View style={{ height: 1, backgroundColor: c.borderNeutral, marginLeft: spacing.item }} />
          </>
        )}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: spacing.item,
          }}
        >
          <AppText variant="caption" tone="tertiary">총 시간</AppText>
          <AppText variant="caption">
            {formatDuration(editedStartTs, editedEndTs ?? record.endedAt)}
          </AppText>
        </View>

        {!isValid && (
          <AppText variant="caption" style={{ color: c.danger, paddingHorizontal: spacing.item, paddingBottom: spacing.sm }}>
            종료 시간이 시작보다 앞서요
          </AppText>
        )}
      </View>

      <AppText variant="caption" tone="tertiary" style={{ marginBottom: spacing.sm }}>
        결과
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.gap }}>
        {RESULT_OPTIONS.map((opt) => {
          const selected = result === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setResult(opt.value)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: selected ? c.ink : c.border,
                backgroundColor: selected ? c.surfaceSubtle : 'transparent',
                alignItems: 'center',
              }}
            >
              <AppText
                variant="caption"
                tone={selected ? 'primary' : 'tertiary'}
                style={selected ? { fontWeight: '700' } : {}}
              >
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SheetModal>
  );
}
