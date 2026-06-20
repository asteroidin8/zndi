import { useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { BarChart, type BarChartItem } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { FastingRecordEditModal } from '@/components/FastingRecordEditModal';
import { SectionHeader } from '@/components/SectionHeader';
import { StatsSummarySkeleton } from '@/components/Skeleton';
import { StatsBentoStats } from '@/components/stats/StatsBentoStats';
import { StatsDayDetailModal } from '@/components/stats/StatsDayDetailModal';
import { StatsMonthGrid } from '@/components/stats/StatsMonthGrid';
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';
import { STATS_LABELS, WEEKDAY_SHORT } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useAppHydrated } from '@/hooks/useAppHydrated';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { FastingRecord } from '@/types';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { buildMonthGrassMap } from '@/utils/calendarGrass';
import { formatMetric } from '@/utils/formatMetric';
import { toDateStr } from '@/utils/homeDailyBoard';
import { type DailyFastingSummary, formatMinutes, groupFastingByDay } from '@/utils/statsHelper';

const TAB_INDEX = 3 as const;
const L = STATS_LABELS;
const SCREEN_WIDTH = Dimensions.get('window').width;

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

  const todayDateStr = toDateStr(new Date());
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

              <StatsMonthGrid
                year={viewYear}
                month={viewMonth}
                summaries={summaries}
                grassMap={grassMap}
                onSelect={setSelected}
              />
            </View>

            <View style={{ gap: 12 }}>
              <SectionHeader title={L.sectionFasting} />
              {!hydrated ? (
                <StatsSummarySkeleton />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatsSummaryCard label={L.totalRecords} value={`${records.length}${L.timesUnit}`} />
                  <StatsSummaryCard label={L.completed} value={`${completedFasts}${L.timesUnit}`} />
                  <StatsSummaryCard label={L.avgDuration} value={formatMinutes(avgFastMinutes)} />
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
                  <StatsSummaryCard label={L.totalRoutines} value={`${routines.length}${L.countUnit}`} />
                  <StatsSummaryCard label={L.todayRoutines} value={`${todayRoutines.length}${L.countUnit}`} />
                  <StatsSummaryCard
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
                  <StatsSummaryCard label={L.completionRate} value={`${completionRate}%`} />
                  <StatsSummaryCard
                    label={L.importantTodos}
                    value={totalHighPriority > 0 ? `${completedHighPriority}/${totalHighPriority}` : '-'}
                  />
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {selected && (
        <StatsDayDetailModal
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
          if (editingRecord) updateRecord(editingRecord.id, { result: updates.result, startedAt: updates.startedAt, ...(updates.endedAt != null ? { endedAt: updates.endedAt } : {}) });
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
