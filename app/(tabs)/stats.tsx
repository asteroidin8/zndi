import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FastingRecordEditModal } from '@/components/FastingRecordEditModal';
import { ShareableGrassGrid } from '@/components/stats/ShareableGrassGrid';
import { StatsBentoStats } from '@/components/stats/StatsBentoStats';
import { StatsDayDetailModal } from '@/components/stats/StatsDayDetailModal';
import { StatsMonthGrid } from '@/components/stats/StatsMonthGrid';
import { STATS_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useShareGrass } from '@/hooks/useShareGrass';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { FastingRecord } from '@/types';
import { appAlert } from '@/stores/useAlertStore';
import { useBoardStore } from '@/stores/useBoardStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { type StatsCardId, useStatsCardStore } from '@/stores/useStatsCardStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { buildBoardRoutineData, countBoardCompletionsForDate, countBoardRoutinesTotal } from '@/utils/boardRoutineStats';
import { buildMonthGrassMap } from '@/utils/calendarGrass';
import { formatMetric } from '@/utils/formatMetric';
import { localDateStr } from '@/utils/dateFormat';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';
import { type DailyFastingSummary, groupFastingByDay } from '@/utils/statsHelper';

const TAB_INDEX = 4 as const;
const L = STATS_LABELS;

function StatCard({
  icon,
  title,
  metric,
  onPress,
}: {
  icon: string;
  title: string;
  metric: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Card pressable onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.gap }}>
        <AppIcon name={icon as never} size={18} color={c.primary} />
        <AppText variant="body" style={{ flex: 1, fontWeight: '600' }}>{title}</AppText>
        <AppText variant="body" style={{ fontWeight: '700' }}>{metric}</AppText>
        <AppIcon name="ChevronRight" size={16} color={c.inkDisabled} />
      </View>
    </Card>
  );
}

export default function StatsScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { records, removeRecord, updateRecord } = useFastingStore();
  const { routines } = useRoutineStore();
  const { todos } = useTodoStore();
  const { isCompleted } = useRoutineCompletionStore();
  const { profile } = useUserStore();
  const { cards } = useStatsCardStore();
  const { user } = useAuth();
  const boardRoutines = useBoardStore((s) => s.routines);
  const boardLogs = useBoardStore((s) => s.logs);

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

  const boardTotal = countBoardRoutinesTotal(boardRoutines);
  const todayDateStr = localDateStr(now);

  const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));
  const personalCompletedToday = todayRoutines.filter((r) => isCompleted(r.id, todayDateStr)).length;
  const boardCompletedToday = user && boardTotal > 0
    ? countBoardCompletionsForDate(boardLogs, user.id, todayDateStr)
    : 0;
  const totalTodayRoutines = todayRoutines.length + boardTotal;
  const completedRoutinesToday = personalCompletedToday + boardCompletedToday;

  const completedTodos = todos.filter((t) => t.completedAt !== null).length;
  const completionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  const isDataEmpty = records.length === 0 && routines.length === 0 && todos.length === 0 && boardTotal === 0;

  const hasWeight = profile.weightKg != null && profile.targetWeightKg != null;

  const visibleCards = useMemo(
    () => cards.filter((c) => c.visible && (c.id !== 'weight' || hasWeight)),
    [cards, hasWeight],
  );

  function renderCardById(id: StatsCardId) {
    switch (id) {
      case 'fasting':
        return (
          <StatCard
            key="fasting"
            icon="Timer"
            title={L.sectionFasting}
            metric={`${completedFasts}${L.timesUnit}`}
            onPress={() => router.push('/stats/fasting')}
          />
        );
      case 'routine':
        return (
          <StatCard
            key="routine"
            icon="RotateCcw"
            title={L.sectionRoutine}
            metric={`${completedRoutinesToday}/${totalTodayRoutines}${L.countUnit}`}
            onPress={() => router.push('/stats/routine')}
          />
        );
      case 'todo':
        return (
          <StatCard
            key="todo"
            icon="ListTodo"
            title={L.sectionTodo}
            metric={`${completionRate}%`}
            onPress={() => router.push('/stats/todo')}
          />
        );
      case 'weight':
        if (!hasWeight) return null;
        return (
          <StatCard
            key="weight"
            icon="Scale"
            title={L.sectionWeightGoal}
            metric={`${formatMetric(profile.weightKg!, 'kg')} ${L.weightArrow} ${formatMetric(profile.targetWeightKg!, 'kg')}`}
            onPress={() => router.push('/stats/weight')}
          />
        );
    }
  }

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

  const boardData = useMemo(
    () => (user ? buildBoardRoutineData(boardRoutines, boardLogs, user.id) : undefined),
    [boardRoutines, boardLogs, user],
  );
  const grassMap = buildMonthGrassMap(viewYear, viewMonth, routines, isCompleted, todos, boardData);
  const { gridRef, share } = useShareGrass();

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="title">{L.title}</AppText>
          {!isDataEmpty && (
            <Pressable
              onPress={() => router.push('/stats/cards')}
              hitSlop={8}
              style={{ padding: 4 }}
              accessibilityLabel="카드 편집"
            >
              <AppIcon name="Settings2" size={20} color={c.inkTertiary} />
            </Pressable>
          )}
        </View>

        <StatsBentoStats />

        {isDataEmpty ? (
          <EmptyState
            variant="stats"
            message={`${L.emptyBodyLine1}\n${L.emptyBodyLine2}`}
          />
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
                <Pressable
                  onPress={() => share(viewYear, viewMonth)}
                  hitSlop={8}
                  style={{ padding: 4, marginLeft: 'auto' }}
                  accessibilityLabel="잔디 공유"
                >
                  <AppIcon name="Share2" size={16} color={c.inkTertiary} />
                </Pressable>
              </View>

              <StatsMonthGrid
                year={viewYear}
                month={viewMonth}
                summaries={summaries}
                grassMap={grassMap}
                onSelect={setSelected}
              />
            </View>

            <View style={{ gap: spacing.md }}>
              {visibleCards.map((card) => renderCardById(card.id))}
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

      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ShareableGrassGrid
          ref={gridRef}
          year={viewYear}
          month={viewMonth}
          grassMap={grassMap}
          nickname={profile.nickname}
        />
      </View>

      <FastingRecordEditModal
        visible={editingRecord !== null}
        record={editingRecord}
        onSave={(updates) => {
          if (editingRecord)
            updateRecord(editingRecord.id, {
              result: updates.result,
              startedAt: updates.startedAt,
              ...(updates.endedAt != null ? { endedAt: updates.endedAt } : {}),
            });
          setEditingRecord(null);
        }}
        onDelete={() => {
          if (!editingRecord) return;
          appAlert(L.deleteAlertTitle, L.deleteAlertMessage, [
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
