import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FastingRecordEditModal } from '@/components/FastingRecordEditModal';
import { StatsBentoStats } from '@/components/stats/StatsBentoStats';
import { StatsDayDetailModal } from '@/components/stats/StatsDayDetailModal';
import { StatsMonthGrid } from '@/components/stats/StatsMonthGrid';
import { STATS_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { FastingRecord } from '@/types';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { type StatsCardId, useStatsCardStore } from '@/stores/useStatsCardStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { buildMonthGrassMap } from '@/utils/calendarGrass';
import { formatMetric } from '@/utils/formatMetric';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';
import { type DailyFastingSummary, groupFastingByDay } from '@/utils/statsHelper';

const TAB_INDEX = 3 as const;
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

  const todayRoutines = routines.filter((r) => isRoutineScheduledForDate(r, now));
  const todayDateStr = now.toISOString().slice(0, 10);
  const completedRoutinesToday = todayRoutines.filter((r) => isCompleted(r.id, todayDateStr)).length;

  const completedTodos = todos.filter((t) => t.completedAt !== null).length;
  const completionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  const isDataEmpty = records.length === 0 && routines.length === 0 && todos.length === 0;

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
            metric={`${completedRoutinesToday}/${todayRoutines.length}${L.countUnit}`}
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
          <Card key="weight" style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="tertiary">{L.sectionWeightGoal}</AppText>
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {formatMetric(profile.weightKg!, 'kg')} {L.weightArrow}{' '}
              {formatMetric(profile.targetWeightKg!, 'kg')}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              {profile.weightKg! > profile.targetWeightKg!
                ? `${(profile.weightKg! - profile.targetWeightKg!).toFixed(1)}kg ${L.weightToLose}`
                : profile.weightKg! < profile.targetWeightKg!
                  ? `${(profile.targetWeightKg! - profile.weightKg!).toFixed(1)}kg ${L.weightToGain}`
                  : L.weightAtGoal}
            </AppText>
          </Card>
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
