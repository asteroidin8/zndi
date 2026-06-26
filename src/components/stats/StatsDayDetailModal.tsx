import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { CompletionCheckbox } from '@/components/CompletionCheckbox';
import { Divider } from '@/components/Divider';
import { SheetModal } from '@/components/SheetModal';
import { opacity, spacing } from '@/constants/spacing';
import { STATS_LABELS } from '@/constants/statsLabels';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { useTodoStore } from '@/stores/useTodoStore';
import type { FastingRecord } from '@/types';
import { localDateStr } from '@/utils/dateFormat';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';
import { formatHHMM, formatMinutes } from '@/utils/statsHelper';
import { feedbackComplete, feedbackUncomplete } from '@/utils/microFeedback';

const L = STATS_LABELS;

type Props = {
  date: string;
  onEditFastingRecord: (record: FastingRecord) => void;
  onClose: () => void;
};

export function StatsDayDetailModal({ date, onEditFastingRecord, onClose }: Props) {
  const c = useThemeColors();
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');

  const allRoutines = useRoutineStore((s) => s.routines);
  const completions = useRoutineCompletionStore((s) => s.completions);
  const { isCompleted, toggleCompletion } = useRoutineCompletionStore.getState();
  const allTodos = useTodoStore((s) => s.todos);
  const records = useFastingStore((s) => s.records);

  const dateObj = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  const scheduledRoutines = useMemo(
    () => allRoutines.filter((r) => !r.deletedAt && isRoutineScheduledForDate(r, dateObj)),
    [allRoutines, dateObj],
  );

  const completedTodos = useMemo(
    () =>
      allTodos.filter((t) => {
        if (!t.completedAt || t.deletedAt) return false;
        return localDateStr(new Date(t.completedAt)) === date;
      }),
    [allTodos, date],
  );

  const fastingRecords = useMemo(
    () =>
      records
        .filter((r) => r.endedAt && localDateStr(new Date(r.startedAt)) === date)
        .map((r) => ({
          id: r.id,
          startedAt: r.startedAt,
          endedAt: r.endedAt!,
          goalHours: r.goalHours,
          result: r.result ?? ('abandoned' as const),
        })),
    [records, date],
  );

  const fastingTotalMinutes = fastingRecords.reduce(
    (sum, r) => sum + Math.floor((r.endedAt - r.startedAt) / 60_000),
    0,
  );

  const hasRoutines = scheduledRoutines.length > 0;
  const hasTodos = completedTodos.length > 0;
  const hasFasting = fastingRecords.length > 0;
  const isEmpty = !hasRoutines && !hasTodos && !hasFasting;

  function handleToggleRoutine(routineId: string) {
    if (isCompleted(routineId, date)) feedbackUncomplete();
    else feedbackComplete();
    toggleCompletion(routineId, date);
  }

  return (
    <SheetModal visible onClose={onClose} title={dateLabel} scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '60%' }}>
        {isEmpty && (
          <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center', paddingVertical: spacing.section }}>
            이 날의 기록이 없어요
          </AppText>
        )}

        {hasRoutines && (
          <View style={{ marginBottom: spacing.section }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
              <AppIcon name="RotateCcw" size={14} color={c.inkTertiary} />
              <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
                루틴 ({scheduledRoutines.filter((r) => isCompleted(r.id, date)).length}/{scheduledRoutines.length})
              </AppText>
            </View>
            {scheduledRoutines.map((routine, i) => {
              const done = isCompleted(routine.id, date);
              return (
                <View key={routine.id}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      gap: spacing.item,
                      opacity: done ? opacity.completed : 1,
                    }}
                  >
                    <CompletionCheckbox
                      checked={done}
                      onToggle={() => handleToggleRoutine(routine.id)}
                      label={`${routine.name} 완료 토글`}
                    />
                    <AppText
                      variant="body"
                      style={done ? { textDecorationLine: 'line-through', color: c.inkDisabled } : {}}
                    >
                      {routine.name}
                    </AppText>
                  </View>
                  {i < scheduledRoutines.length - 1 && <Divider />}
                </View>
              );
            })}
          </View>
        )}

        {hasTodos && (
          <View style={{ marginBottom: spacing.section }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
              <AppIcon name="ListTodo" size={14} color={c.inkTertiary} />
              <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
                완료한 할일 ({completedTodos.length})
              </AppText>
            </View>
            {completedTodos.map((todo, i) => (
              <View key={todo.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: spacing.item }}>
                  <AppIcon name="CheckCircle2" size={18} color={c.primary} />
                  <AppText variant="body">{todo.title}</AppText>
                </View>
                {i < completedTodos.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        )}

        {hasFasting && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
              <AppIcon name="Timer" size={14} color={c.inkTertiary} />
              <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
                단식 ({formatMinutes(fastingTotalMinutes)}, {fastingRecords.length}회)
              </AppText>
            </View>
            {fastingRecords.map((r, i) => (
              <View key={r.id}>
                <Pressable
                  onPress={() =>
                    onEditFastingRecord({
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
                    {formatHHMM(r.startedAt, timeFormat)} {L.timeRangeSeparator} {formatHHMM(r.endedAt, timeFormat)}
                  </AppText>
                </Pressable>
                {i < fastingRecords.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SheetModal>
  );
}
