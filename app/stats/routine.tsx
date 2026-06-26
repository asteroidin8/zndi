import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { BarChart, type BarChartItem } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { STATS_LABELS, WEEKDAY_SHORT } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBoardStore } from '@/stores/useBoardStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { countBoardRoutinesTotal, countBoardCompletionsForDate } from '@/utils/boardRoutineStats';
import { localDateStr } from '@/utils/dateFormat';
import { type Period, getPeriodRange, getDaysInRange } from '@/utils/periodRange';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';

const L = STATS_LABELS;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RoutineDetailScreen() {
  const c = useThemeColors();
  const allRoutines = useRoutineStore((s) => s.routines);
  const routines = allRoutines.filter((r) => !r.deletedAt);
  const completions = useRoutineCompletionStore((s) => s.completions);
  const { getStreak, isCompleted } = useRoutineCompletionStore.getState();
  const { user } = useAuth();
  const boards = useBoardStore((s) => s.boards);
  const boardRoutines = useBoardStore((s) => s.routines);
  const boardLogs = useBoardStore((s) => s.logs);

  const [period, setPeriod] = useState<Period>('weekly');
  const [offset, setOffset] = useState(0);

  const now = new Date();
  const isCurrent = offset === 0;
  const { start, end, label: periodLabel } = getPeriodRange(period, offset);
  const daysInPeriod = getDaysInRange(start, end);

  let totalScheduled = 0;
  let totalCompleted = 0;
  for (const day of daysInPeriod) {
    const ds = localDateStr(day);
    const scheduled = routines.filter((r) => isRoutineScheduledForDate(r, day));
    const completed = scheduled.filter((r) => isCompleted(r.id, ds)).length;
    totalScheduled += scheduled.length;
    totalCompleted += completed;
  }
  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  const maxStreak = routines.reduce((max, r) => Math.max(max, getStreak(r.id, r)), 0);
  const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));

  const chartDays = period === 'weekly' ? daysInPeriod : daysInPeriod.slice(-7);
  const chartData: BarChartItem[] = chartDays.map((d) => {
    const ds = localDateStr(d);
    const scheduled = routines.filter((r) => isRoutineScheduledForDate(r, d));
    const completed = scheduled.filter((r) => isCompleted(r.id, ds)).length;
    return {
      label: WEEKDAY_SHORT[d.getDay()],
      value: completed,
      isToday: ds === localDateStr(now),
    };
  });
  const hasChartData = chartData.some((d) => d.value > 0);

  const boardTotal = countBoardRoutinesTotal(boardRoutines);
  const boardCompletedToday = user
    ? countBoardCompletionsForDate(boardLogs, user.id, localDateStr(now))
    : 0;

  const todayStr = localDateStr(now);

  function switchPeriod(p: Period) {
    setPeriod(p);
    setOffset(0);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title={L.detailRoutine} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['weekly', 'monthly'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => switchPeriod(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: period === p ? c.primary : c.surfaceMuted,
              }}
            >
              <AppText
                variant="caption"
                style={{ color: period === p ? '#fff' : c.inkSecondary, fontWeight: '600' }}
              >
                {p === 'weekly' ? '주간' : '월간'}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={8} style={{ padding: 4 }}>
            <AppIcon name="ChevronLeft" size={18} color={c.inkSecondary} />
          </Pressable>
          <AppText variant="body" style={{ fontWeight: '700', minWidth: 120, textAlign: 'center' }}>
            {periodLabel}
          </AppText>
          <Pressable
            onPress={() => setOffset((o) => o + 1)}
            hitSlop={8}
            style={{ padding: 4, opacity: isCurrent ? 0.3 : 1 }}
            disabled={isCurrent}
          >
            <AppIcon name="ChevronRight" size={18} color={c.inkSecondary} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard label={L.completionRate} value={`${completionRate}%`} />
          <StatsSummaryCard label={L.completed} value={`${totalCompleted}${L.timesUnit}`} />
          <StatsSummaryCard
            label={L.maxStreak}
            value={maxStreak > 0 ? `${maxStreak}${L.dayUnit}` : '-'}
          />
        </View>

        {isCurrent && (
          <View style={{ flexDirection: 'row', gap: spacing.gap }}>
            <StatsSummaryCard label={L.totalRoutines} value={`${routines.length}${L.countUnit}`} />
            <StatsSummaryCard label={L.todayRoutines} value={`${todayRoutines.length}${L.countUnit}`} />
          </View>
        )}

        {hasChartData && (
          <View style={{ gap: 8 }}>
            <AppText variant="caption" tone="tertiary">
              {period === 'weekly' ? '주간' : '최근 7일'} 완료 수
            </AppText>
            <BarChart data={chartData} width={SCREEN_WIDTH - 40} height={130} unit="개" />
          </View>
        )}

        {routines.length > 0 ? (
          <View style={{ gap: 8 }}>
            {routines.map((r) => {
              const streak = getStreak(r.id, r);
              const done = isCompleted(r.id, todayStr);
              return (
                <Card key={r.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="body" style={{ fontWeight: '600' }}>
                      {r.name}
                    </AppText>
                    <AppText variant="caption" tone="tertiary">
                      {streak > 0 ? `${streak}${L.dayUnit} ${L.maxStreak}` : L.maxStreak + ' -'}
                    </AppText>
                  </View>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: done ? c.primary : c.surfaceMuted,
                    }}
                  />
                </Card>
              );
            })}
          </View>
        ) : (
          <EmptyState inline variant="routine" message={L.noRecords} />
        )}

        {boardTotal > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="caption" tone="tertiary">공동 루틴</AppText>
              <AppText variant="caption" tone="tertiary">
                오늘 {boardCompletedToday}/{boardTotal}
              </AppText>
            </View>
            {boards.map((board) => {
              const bRoutines = boardRoutines[board.id] ?? [];
              if (bRoutines.length === 0) return null;
              const todayLogs = (boardLogs[board.id] ?? []).filter(
                (l) => user && l.userId === user.id && localDateStr(new Date(l.createdAt)) === localDateStr(now),
              );
              const verifiedIds = new Set(todayLogs.map((l) => l.routineId));
              return bRoutines.map((br) => (
                <Card key={br.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="body" style={{ fontWeight: '600' }}>
                      {br.name}
                    </AppText>
                    <AppText variant="caption" tone="tertiary">
                      {board.name}
                    </AppText>
                  </View>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: verifiedIds.has(br.id) ? c.primary : c.surfaceMuted,
                    }}
                  />
                </Card>
              ));
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
