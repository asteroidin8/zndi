import { useMemo } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { radius, spacing } from '@/constants/spacing';
import { STATS_LABELS } from '@/constants/statsLabels';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFastingStore } from '@/stores/useFastingStore';
import type { FastingRecord } from '@/types';
import { localDateStr } from '@/utils/dateFormat';
import { formatHHMM, formatMinutes } from '@/utils/statsHelper';

const L = STATS_LABELS;
const WINDOW = Dimensions.get('window');

type Props = {
  date: string;
  onEditRecord: (record: FastingRecord) => void;
  onClose: () => void;
};

export function FastingDayDetailModal({ date, onEditRecord, onClose }: Props) {
  const c = useThemeColors();
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');
  const records = useFastingStore((s) => s.records);

  const { backdropStyle, contentStyle } = useModalAnimation();

  const dateObj = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

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

  const totalMinutes = fastingRecords.reduce(
    (sum, r) => sum + Math.floor((r.endedAt - r.startedAt) / 60_000),
    0,
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: c.surface }, contentStyle]}>
          <View style={styles.header}>
            <AppText variant="title" style={{ flex: 1 }}>{dateLabel}</AppText>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
              <AppIcon name="X" size={18} color={c.inkTertiary} />
            </Pressable>
          </View>

          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <AppIcon name="Timer" size={14} color={c.primary} />
              <AppText variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
                {formatMinutes(totalMinutes)}
              </AppText>
            </View>
            <AppText variant="caption" tone="tertiary">
              {fastingRecords.length}회
            </AppText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: WINDOW.height * 0.45 }}>
            {fastingRecords.map((r, i) => (
              <View key={r.id}>
                {i > 0 && <Divider />}
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
                  style={styles.recordRow}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="body" style={{ fontWeight: '600' }}>
                      {formatMinutes(Math.floor((r.endedAt - r.startedAt) / 60_000))}
                    </AppText>
                    <AppText variant="caption" tone="tertiary">
                      {formatHHMM(r.startedAt, timeFormat)} {L.timeRangeSeparator} {formatHHMM(r.endedAt, timeFormat)}
                    </AppText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppText variant="caption" tone={r.result === 'completed' ? 'secondary' : 'tertiary'}>
                      {r.result === 'completed' ? L.resultCompleted : L.resultAbandoned}
                    </AppText>
                    <AppIcon name="ChevronRight" size={14} color={c.inkDisabled} />
                  </View>
                </Pressable>
              </View>
            ))}
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
