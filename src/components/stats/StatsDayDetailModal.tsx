import { useEffect, useMemo } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { CompletionCheckbox } from '@/components/CompletionCheckbox';
import { Divider } from '@/components/Divider';
import { opacity, radius, spacing } from '@/constants/spacing';
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
const WINDOW = Dimensions.get('window');

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

  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 220 });
  }, [backdropOpacity, scale]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: backdropOpacity.value,
  }));

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

  const incompleteDueTodos = useMemo(
    () =>
      allTodos.filter((t) => {
        if (t.completedAt || t.deletedAt || !t.dueDate) return false;
        return t.dueDate === date;
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
  const hasTodos = completedTodos.length > 0 || incompleteDueTodos.length > 0;
  const hasFasting = fastingRecords.length > 0;
  const isEmpty = !hasRoutines && !hasTodos && !hasFasting;

  const routineDoneCount = scheduledRoutines.filter((r) => isCompleted(r.id, date)).length;

  function handleToggleRoutine(routineId: string) {
    if (isCompleted(routineId, date)) feedbackUncomplete();
    else feedbackComplete();
    toggleCompletion(routineId, date);
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: c.surface }, contentStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="title" style={{ flex: 1 }}>{dateLabel}</AppText>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
              <AppIcon name="X" size={18} color={c.inkTertiary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: WINDOW.height * 0.55 }}>
            {isEmpty && (
              <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center', paddingVertical: spacing.section }}>
                이 날의 기록이 없어요
              </AppText>
            )}

            {/* Routines | Todos side by side */}
            {(hasRoutines || hasTodos) && (
              <View style={styles.widgetRow}>
                {hasRoutines && (
                  <View style={[styles.widget, { backgroundColor: c.surfaceSubtle, borderColor: c.borderNeutral }, hasTodos && { marginRight: spacing.sm }]}>
                    <View style={styles.widgetHeader}>
                      <AppIcon name="RotateCcw" size={13} color={c.inkTertiary} />
                      <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
                        루틴
                      </AppText>
                      <AppText variant="caption" tone="disabled" style={{ marginLeft: 'auto' }}>
                        {routineDoneCount}/{scheduledRoutines.length}
                      </AppText>
                    </View>
                    {scheduledRoutines.map((routine, i) => {
                      const done = isCompleted(routine.id, date);
                      return (
                        <View key={routine.id}>
                          {i > 0 && <Divider />}
                          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.sm, opacity: done ? opacity.completed : 1 }}>
                            <CompletionCheckbox
                              checked={done}
                              onToggle={() => handleToggleRoutine(routine.id)}
                              label={`${routine.name} 완료 토글`}
                              size={18}
                              iconSize={10}
                            />
                            <AppText
                              variant="caption"
                              numberOfLines={1}
                              style={[{ flex: 1 }, done && { textDecorationLine: 'line-through', color: c.inkDisabled }]}
                            >
                              {routine.name}
                            </AppText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {hasTodos && (
                  <View style={[styles.widget, { backgroundColor: c.surfaceSubtle, borderColor: c.borderNeutral }, hasRoutines && { marginLeft: spacing.sm }]}>
                    <View style={styles.widgetHeader}>
                      <AppIcon name="ListTodo" size={13} color={c.inkTertiary} />
                      <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
                        할일
                      </AppText>
                      <AppText variant="caption" tone="disabled" style={{ marginLeft: 'auto' }}>
                        {completedTodos.length}/{completedTodos.length + incompleteDueTodos.length}
                      </AppText>
                    </View>
                    {incompleteDueTodos.map((todo, i) => (
                      <View key={todo.id}>
                        {i > 0 && <Divider />}
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.sm }}>
                          <AppIcon name="Circle" size={14} color={c.inkDisabled} />
                          <AppText variant="caption" numberOfLines={1} style={{ flex: 1, color: c.inkDisabled }}>
                            {todo.title}
                          </AppText>
                        </View>
                      </View>
                    ))}
                    {completedTodos.map((todo, i) => (
                      <View key={todo.id}>
                        {(i > 0 || incompleteDueTodos.length > 0) && <Divider />}
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.sm }}>
                          <AppIcon name="CheckCircle2" size={14} color={c.primary} />
                          <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                            {todo.title}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Fasting records full width */}
            {hasFasting && (
              <View style={[styles.widget, styles.fastingWidget, { backgroundColor: c.surfaceSubtle, borderColor: c.borderNeutral }]}>
                <View style={styles.widgetHeader}>
                  <AppIcon name="Timer" size={13} color={c.inkTertiary} />
                  <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>
                    단식
                  </AppText>
                  <AppText variant="caption" tone="disabled" style={{ marginLeft: 'auto' }}>
                    {formatMinutes(fastingTotalMinutes)} · {fastingRecords.length}회
                  </AppText>
                </View>
                {fastingRecords.map((r, i) => (
                  <View key={r.id}>
                    {i > 0 && <Divider />}
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
                      style={{ paddingVertical: 10, gap: 3 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <AppText variant="caption" style={{ fontWeight: '600' }}>
                          {formatMinutes(Math.floor((r.endedAt - r.startedAt) / 60_000))}
                        </AppText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText variant="caption" tone={r.result === 'completed' ? 'secondary' : 'tertiary'} style={{ fontSize: 11 }}>
                            {r.result === 'completed' ? L.resultCompleted : L.resultAbandoned}
                          </AppText>
                          <AppIcon name="ChevronRight" size={12} color={c.inkDisabled} />
                        </View>
                      </View>
                      <AppText variant="caption" tone="tertiary" style={{ fontSize: 11 }}>
                        {formatHHMM(r.startedAt, timeFormat)} {L.timeRangeSeparator} {formatHHMM(r.endedAt, timeFormat)}
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.section,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.card,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  widgetRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  widget: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  fastingWidget: {
    marginBottom: spacing.sm,
  },
});
