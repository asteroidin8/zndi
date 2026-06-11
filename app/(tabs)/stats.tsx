import { useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { FastingRecordEditModal } from '@/components/FastingRecordEditModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type FastingRecord, useFastingStore } from '@/stores/useFastingStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import {
  type DailyFastingSummary,
  formatHHMM,
  formatMinutes,
  groupFastingByDay,
} from '@/utils/statsHelper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 6 * 6) / 7);

const DAY_LABELS = ['?', '?', '?', '?', '?', '?', '?'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ?? ?? ??? ????????????????????????????????????????????????
function MonthGrid({
  year,
  month,
  summaries,
  onSelect,
}: {
  year: number;
  month: number; // 0-indexed
  summaries: DailyFastingSummary[];
  onSelect: (s: DailyFastingSummary) => void;
}) {
  const c = useThemeColors();
  const dateMap = new Map(summaries.map((s) => [s.date, s]));
  const today = todayStr();

  const firstDay = new Date(year, month, 1).getDay(); // 0=?
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateStr(year, month, i + 1)),
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      {/* ?? ?? */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ width: CELL_SIZE, alignItems: 'center' }}>
            <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>
              {d}
            </AppText>
          </View>
        ))}
      </View>

      {/* ?? ? */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cells.map((date, i) => {
          if (!date) {
            return <View key={`empty-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
          }
          const summary = dateMap.get(date);
          const isToday = date === today;
          const hasFasting = !!summary;

          return (
            <Pressable
              key={date}
              onPress={() => summary && onSelect(summary)}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: CELL_SIZE / 4,
                borderWidth: 1,
                borderColor: isToday ? c.ink : hasFasting ? c.borderStrong : c.border,
                backgroundColor: hasFasting ? c.surfaceSubtle : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText
                variant="caption"
                tone={isToday ? 'primary' : hasFasting ? 'secondary' : 'disabled'}
                style={isToday ? { fontWeight: '700', fontSize: 11 } : { fontSize: 11 }}
              >
                {new Date(date + 'T00:00:00').getDate()}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ?? ?? ?? ?? ???????????????????????????????????????????
function DayDetailModal({
  summary,
  onEditRecord,
  onClose,
}: {
  summary: DailyFastingSummary;
  onEditRecord: (record: FastingRecord) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: c.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingBottom: 34,
          maxHeight: '60%',
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: c.surfaceMuted,
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 16,
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <AppText variant="title">{summary.date}</AppText>
        </View>
        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 20 }}>
          ? {formatMinutes(summary.totalMinutes)} · {summary.count}?
        </AppText>
        <ScrollView showsVerticalScrollIndicator={false}>
          {summary.records.map((r, i) => (
            <View key={r.id}>
              <Pressable
                onPress={() =>
                  onEditRecord({
                    id: r.id,
                    startedAt: r.startedAt,
                    endedAt: r.endedAt,
                    goalHours: r.goalHours,
                    result: r.result,
                  })
                }
                style={{ paddingVertical: 12, gap: 4 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText variant="body">
                    {formatMinutes(Math.floor((r.endedAt - r.startedAt) / 60_000))}
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AppText
                      variant="caption"
                      tone={r.result === 'completed' ? 'secondary' : 'tertiary'}
                    >
                      {r.result === 'completed' ? '??' : '?? ??'}
                    </AppText>
                    <AppIcon name="ChevronRight" size={14} color={c.inkDisabled} />
                  </View>
                </View>
                <AppText variant="caption" tone="tertiary">
                  {formatHHMM(r.startedAt)} ? {formatHHMM(r.endedAt)}
                </AppText>
              </Pressable>
              {i < summary.records.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ?? ?? ?? ????????????????????????????????????????????????
function SummaryCard({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surfaceSubtle,
        borderRadius: 14,
        padding: 14,
        gap: 6,
        minHeight: 72,
        justifyContent: 'space-between',
      }}
    >
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
      <AppText variant="title" style={{ fontSize: 20, fontWeight: '700' }}>
        {value}
      </AppText>
    </View>
  );
}

// ?? ?? ?? ????????????????????????????????????????????????
function SectionHeader({ title }: { title: string }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
      <View style={{ width: 3, height: 14, backgroundColor: c.ink, borderRadius: 2 }} />
      <AppText variant="body" style={{ fontWeight: '700' }}>
        {title}
      </AppText>
    </View>
  );
}

// ?? ?? ?? ????????????????????????????????????????????????
export default function StatsScreen() {
  const c = useThemeColors();
  const { records, removeRecord, updateRecord } = useFastingStore();
  const { routines } = useRoutineStore();
  const { todos } = useTodoStore();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<DailyFastingSummary | null>(null);
  const [editingRecord, setEditingRecord] = useState<FastingRecord | null>(null);

  const summaries = groupFastingByDay(
    records.map((r) => ({
      id: r.id,
      startedAt: r.startedAt,
      endedAt: r.endedAt ?? r.startedAt,
      goalHours: r.goalHours,
      result: r.result ?? 'abandoned',
    })),
  );

  // ? ?? ?? ?
  const completedFasts = records.filter((r) => r.result === 'completed').length;
  const abandonedFasts = records.filter((r) => r.result === 'abandoned').length;
  const finishedFasts = records.filter((r) => r.endedAt);
  const avgFastMinutes =
    finishedFasts.length > 0
      ? Math.floor(
          finishedFasts.reduce(
            (acc, r) => acc + ((r.endedAt ?? r.startedAt) - r.startedAt) / 60_000,
            0,
          ) / finishedFasts.length,
        )
      : 0;

  // ? ?? ?? ?
  const todayWeekday = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const todayRoutines = routines.filter((r) => r.repeatDays.includes(todayWeekday));

  // ? ?? ?? ?
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.completedAt !== null).length;
  const totalHighPriority = todos.filter((t) => t.priority === 'high').length;
  const completedHighPriority = todos.filter((t) => t.priority === 'high' && !!t.completedAt).length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // ? ? ?? ?
  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    const maxYear = now.getFullYear();
    const maxMonth = now.getMonth();
    if (viewYear === maxYear && viewMonth === maxMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }
  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="title">??</AppText>

        {/* ?? ?? ?? */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="??" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SummaryCard label="? ??" value={`${records.length}?`} />
            <SummaryCard label="??" value={`${completedFasts}?`} />
            <SummaryCard label="?? ??" value={formatMinutes(avgFastMinutes)} />
          </View>
        </View>

        {/* ?? ?? ?? */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="??" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SummaryCard label="?? ??" value={`${routines.length}?`} />
            <SummaryCard label="?? ??" value={`${todayRoutines.length}?`} />
          </View>
        </View>

        {/* ?? ?? ?? */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="??" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SummaryCard label="???" value={`${completionRate}%`} />
            <SummaryCard label="??? ?" value={totalHighPriority > 0 ? `${completedHighPriority}/${totalHighPriority}` : '-'} />
          </View>
        </View>

        <Divider />

        {/* ?? ?? ?? ?? */}
        <View style={{ gap: 12 }}>
          {/* ??: < ?? > ?? */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Pressable
              onPress={prevMonth}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <AppIcon name="ChevronLeft" size={18} color={c.inkSecondary} />
            </Pressable>

            <AppText variant="body" style={{ fontWeight: '700', minWidth: 90, textAlign: 'center' }}>
              {viewYear}? {viewMonth + 1}?
            </AppText>

            <Pressable
              onPress={nextMonth}
              hitSlop={8}
              style={{ padding: 4, opacity: isCurrentMonth ? 0.3 : 1 }}
              disabled={isCurrentMonth}
            >
              <AppIcon name="ChevronRight" size={18} color={c.inkSecondary} />
            </Pressable>

            {!isCurrentMonth && (
              <Pressable
                onPress={goToday}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <AppText variant="caption" tone="tertiary">
                  ??
                </AppText>
              </Pressable>
            )}
          </View>

          <MonthGrid
            year={viewYear}
            month={viewMonth}
            summaries={summaries}
            onSelect={setSelected}
          />

          {records.length === 0 && (
            <AppText variant="caption" tone="disabled" style={{ textAlign: 'center' }}>
              ?? ?? ??? ???
            </AppText>
          )}
        </View>
      </ScrollView>

      {selected && (
        <DayDetailModal
          summary={selected}
          onEditRecord={(r) => {
            setEditingRecord(r);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}

      <FastingRecordEditModal
        visible={editingRecord !== null}
        record={editingRecord}
        onSave={(updates) => {
          if (editingRecord) updateRecord(editingRecord.id, updates);
          setEditingRecord(null);
        }}
        onDelete={() => {
          if (!editingRecord) return;
          Alert.alert('?? ??', '? ?? ??? ????????', [
            { text: '??', style: 'cancel' },
            {
              text: '??',
              style: 'destructive',
              onPress: () => {
                removeRecord(editingRecord.id);
                setEditingRecord(null);
              },
            },
          ]);
        }}
        onClose={() => setEditingRecord(null)}
      />
    </SafeAreaView>
  );
}
