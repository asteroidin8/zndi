import { useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { BarChart, type BarChartItem } from '@/components/BarChart';
import { StatsBentoStats } from '@/components/stats/StatsBentoStats';
import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { FastingRecordEditModal } from '@/components/FastingRecordEditModal';
import { SectionHeader } from '@/components/SectionHeader';
import { StatsSummarySkeleton } from '@/components/Skeleton';
import { SpringModal } from '@/components/SpringModal';
import { DAY_LABELS, STATS_LABELS, WEEKDAY_SHORT } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useAppHydrated } from '@/hooks/useAppHydrated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type FastingRecord, useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import {
  type DailyFastingSummary,
  formatHHMM,
  formatMinutes,
  groupFastingByDay,
} from '@/utils/statsHelper';
import { formatMetric } from '@/utils/formatMetric';
import {
  buildMonthGrassMap,
  grassCellColors,
  type DailyGrassActivity,
} from '@/utils/calendarGrass';

const TAB_INDEX = 4 as const;
const L = STATS_LABELS;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 6 * 6) / 7);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function MonthGrid({
  year,
  month,
  summaries,
  grassMap,
  onSelect,
}: {
  year: number;
  month: number;
  summaries: DailyFastingSummary[];
  grassMap: Map<string, DailyGrassActivity>;
  onSelect: (s: DailyFastingSummary) => void;
}) {
  const c = useThemeColors();
  const dateMap = new Map(summaries.map((s) => [s.date, s]));
  const today = todayStr();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateStr(year, month, i + 1)),
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.xs }}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ width: CELL_SIZE, alignItems: 'center' }}>
            <AppText variant="caption" tone="disabled" style={{ fontSize: 10 }}>
              {d}
            </AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cells.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
          const summary = dateMap.get(date);
          const isToday = date === today;
          const hasFasting = !!summary;
          const grass = grassMap.get(date);
          const level = grass?.level ?? 0;
          const colors = grassCellColors(level, c, isToday, hasFasting);
          const a11yParts = [
            `${new Date(`${date}T00:00:00`).getDate()}일`,
            grass && grass.routineTotal > 0
              ? `루틴 ${grass.routineCompleted}/${grass.routineTotal}`
              : null,
            grass && grass.todosCompleted > 0 ? `할일 ${grass.todosCompleted}개 완료` : null,
            hasFasting ? '단식 기록 있음' : null,
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <Pressable
              key={date}
              onPress={() => summary && onSelect(summary)}
              accessibilityRole="button"
              accessibilityLabel={a11yParts}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: CELL_SIZE / 4,
                borderWidth: isToday ? 1.5 : 1,
                borderColor: colors.borderColor,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                ...(colors.glow
                  ? {
                      shadowColor: c.neonGlow,
                      shadowOpacity: 0.5,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 4,
                    }
                  : {}),
              }}
            >
              {colors.fill !== 'transparent' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: colors.fill,
                    opacity: colors.fillOpacity,
                  }}
                />
              )}
              <AppText
                variant="caption"
                tone={isToday ? 'primary' : level > 0 ? 'secondary' : hasFasting ? 'secondary' : 'disabled'}
                style={{
                  fontSize: 11,
                  fontWeight: isToday ? '700' : level >= 3 ? '600' : '400',
                  zIndex: 1,
                }}
              >
                {new Date(`${date}T00:00:00`).getDate()}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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
    <SpringModal visible onClose={onClose}>
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: spacing.screen,
            paddingTop: 16,
            paddingBottom: 34,
            maxHeight: '60%',
          }}
        >
          <AppText variant="title">{summary.date}</AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 20, marginTop: 4 }}>
          {L.summaryPrefix} {formatMinutes(summary.totalMinutes)} {L.summarySeparator} {summary.count}
          {L.summarySuffix}
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
                    <AppText variant="caption" tone={r.result === 'completed' ? 'secondary' : 'tertiary'}>
                      {r.result === 'completed' ? L.resultCompleted : L.resultAbandoned}
                    </AppText>
                    <AppIcon name="ChevronRight" size={14} color={c.inkDisabled} />
                  </View>
                </View>
                <AppText variant="caption" tone="tertiary">
                  {formatHHMM(r.startedAt)} {L.timeRangeSeparator} {formatHHMM(r.endedAt)}
                </AppText>
              </Pressable>
              {i < summary.records.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      </View>
    </SpringModal>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, minHeight: 72, justifyContent: 'space-between', gap: 6 }}>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
      <AppText variant="title" style={{ fontSize: 20, fontWeight: '700' }}>
        {value}
      </AppText>
    </Card>
  );
}

export default function StatsScreen() {
  const c = useThemeColors();
  const hydrated = useAppHydrated();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { records, removeRecord, updateRecord } = useFastingStore();
  const { routines } = useRoutineStore();
  const { todos } = useTodoStore();
  const { getStreak, isCompleted } = useRoutineCompletionStore();
  const { profile } = useUserStore();

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

  const completedFasts = records.filter((r) => r.result === 'completed').length;
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

  const todayWeekday = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const todayRoutines = routines.filter((r) => r.repeatDays.includes(todayWeekday));
  const maxStreak = routines.reduce((max, r) => Math.max(max, getStreak(r.id, r.repeatDays)), 0);

  const completedTodos = todos.filter((t) => t.completedAt !== null).length;
  const totalHighPriority = todos.filter((t) => t.priority === 'high').length;
  const completedHighPriority = todos.filter((t) => t.priority === 'high' && !!t.completedAt).length;
  const completionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  const todayDateStr = todayStr();
  const last7Days: BarChartItem[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const dayRecords = records.filter(
      (r) => new Date(r.startedAt).toISOString().slice(0, 10) === ds,
    );
    const totalHours = Math.round(
      dayRecords.reduce(
        (acc, r) => acc + ((r.endedAt ?? r.startedAt) - r.startedAt) / 3_600_000,
        0,
      ),
    );
    return {
      label: WEEKDAY_SHORT[d.getDay()],
      value: totalHours,
      isToday: ds === todayDateStr,
    };
  });
  const hasChartData = last7Days.some((d) => d.value > 0);
  const isDataEmpty = records.length === 0 && routines.length === 0 && todos.length === 0;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }
  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const grassMap = buildMonthGrassMap(viewYear, viewMonth, routines, isCompleted, todos);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          { padding: spacing.screen, gap: spacing.section },
          isDataEmpty && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="title">{L.title}</AppText>

        <StatsBentoStats />

        {isDataEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <EmptyIllustration variant="stats" size={48} />
            <AppText variant="body" tone="tertiary" style={{ textAlign: 'center', lineHeight: 22 }}>
              {L.emptyBodyLine1}
              {'\n'}
              {L.emptyBodyLine2}
            </AppText>
          </View>
        ) : (
          <>
            <View style={{ gap: 12 }}>
              <SectionHeader title={L.sectionFasting} />
              {!hydrated ? (
                <StatsSummarySkeleton />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SummaryCard label={L.totalRecords} value={`${records.length}${L.timesUnit}`} />
                  <SummaryCard label={L.completed} value={`${completedFasts}${L.timesUnit}`} />
                  <SummaryCard label={L.avgDuration} value={formatMinutes(avgFastMinutes)} />
                </View>
              )}
            </View>

            {profile.weightKg != null && profile.targetWeightKg != null && (
              <View style={{ gap: spacing.sm }}>
                <SectionHeader title={L.sectionWeightGoal} />
                <Card>
                  <AppText variant="body" style={{ fontWeight: '600' }}>
                    {formatMetric(profile.weightKg, 'kg')} {L.weightArrow}{' '}
                    {formatMetric(profile.targetWeightKg, 'kg')}
                  </AppText>
                  <AppText variant="caption" tone="tertiary" style={{ marginTop: spacing.xs }}>
                    {profile.weightKg > profile.targetWeightKg
                      ? `${(profile.weightKg - profile.targetWeightKg).toFixed(1)}kg ${L.weightToLose}`
                      : profile.weightKg < profile.targetWeightKg
                        ? `${(profile.targetWeightKg - profile.weightKg).toFixed(1)}kg ${L.weightToGain}`
                        : L.weightAtGoal}
                  </AppText>
                </Card>
              </View>
            )}

            {hydrated && hasChartData && (
              <View style={{ gap: 8 }}>
                <AppText variant="caption" tone="tertiary">
                  {L.chartTitle}
                </AppText>
                <BarChart data={last7Days} width={SCREEN_WIDTH - 40} height={130} unit="h" />
              </View>
            )}

            <View style={{ gap: 12 }}>
              <SectionHeader title={L.sectionRoutine} />
              {!hydrated ? (
                <StatsSummarySkeleton />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SummaryCard label={L.totalRoutines} value={`${routines.length}${L.countUnit}`} />
                  <SummaryCard label={L.todayRoutines} value={`${todayRoutines.length}${L.countUnit}`} />
                  <SummaryCard
                    label={L.maxStreak}
                    value={maxStreak > 0 ? `${maxStreak}${L.dayUnit}` : '-'}
                  />
                </View>
              )}
            </View>

            <View style={{ gap: 12 }}>
              <SectionHeader title={L.sectionTodo} />
              {!hydrated ? (
                <StatsSummarySkeleton />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SummaryCard label={L.completionRate} value={`${completionRate}%`} />
                  <SummaryCard
                    label={L.importantTodos}
                    value={totalHighPriority > 0 ? `${completedHighPriority}/${totalHighPriority}` : '-'}
                  />
                </View>
              )}
            </View>

            <Divider />

            <View style={{ gap: 12 }}>
              <SectionHeader title={L.sectionGrass} />
              <AppText variant="caption" tone="tertiary">
                {L.grassCalendarHint}
              </AppText>

              <View
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}
              >
                <Pressable onPress={prevMonth} hitSlop={8} style={{ padding: 4 }}>
                  <AppIcon name="ChevronLeft" size={18} color={c.inkSecondary} />
                </Pressable>
                <AppText variant="body" style={{ fontWeight: '700', minWidth: 90, textAlign: 'center' }}>
                  {viewYear}
                  {L.yearSuffix} {viewMonth + 1}
                  {L.monthSuffix}
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
                      {L.today}
                    </AppText>
                  </Pressable>
                )}
              </View>

              <MonthGrid
                year={viewYear}
                month={viewMonth}
                summaries={summaries}
                grassMap={grassMap}
                onSelect={setSelected}
              />

              {records.length === 0 && (
                <AppText variant="caption" tone="disabled" style={{ textAlign: 'center' }}>
                  {L.noFastingThisMonth}
                </AppText>
              )}
            </View>
          </>
        )}
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
          Alert.alert(L.deleteAlertTitle, L.deleteAlertMessage, [
            { text: L.cancel, style: 'cancel' },
            {
              text: L.delete,
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
