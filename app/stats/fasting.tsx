import { useState } from 'react';
import { Alert, Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { BarChart, type BarChartItem } from '@/components/BarChart';
import { EmptyState } from '@/components/EmptyState';
import { FastingRecordEditModal } from '@/components/FastingRecordEditModal';
import { StatsDayDetailModal } from '@/components/stats/StatsDayDetailModal';
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { STATS_LABELS, WEEKDAY_SHORT } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { FastingRecord } from '@/types';
import { useFastingStore } from '@/stores/useFastingStore';
import { type DailyFastingSummary, formatMinutes, groupFastingByDay } from '@/utils/statsHelper';
import { localDateStr } from '@/utils/dateFormat';
import { toDateStr } from '@/utils/homeDailyBoard';

const L = STATS_LABELS;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function FastingDetailScreen() {
  const c = useThemeColors();
  const { records, removeRecord, updateRecord } = useFastingStore();
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

  const todayDateStr = toDateStr(new Date());
  const last7Days: BarChartItem[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = localDateStr(d);
    const dayRecords = records.filter(
      (r) => localDateStr(new Date(r.startedAt)) === ds,
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title={L.detailFasting} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard label={L.totalRecords} value={`${records.length}${L.timesUnit}`} />
          <StatsSummaryCard label={L.completed} value={`${completedFasts}${L.timesUnit}`} />
          <StatsSummaryCard label={L.avgDuration} value={formatMinutes(avgFastMinutes)} />
        </View>

        {hasChartData && (
          <View style={{ gap: 8 }}>
            <AppText variant="caption" tone="tertiary">
              {L.chartTitle}
            </AppText>
            <BarChart data={last7Days} width={SCREEN_WIDTH - 40} height={130} unit="h" />
          </View>
        )}

        {summaries.length > 0 ? (
          <View style={{ gap: 8 }}>
            {summaries.map((s) => (
              <View
                key={s.date}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: c.borderNeutral,
                }}
              >
                <AppText variant="body">{s.date}</AppText>
                <AppText variant="caption" tone="secondary">
                  {formatMinutes(s.totalMinutes)} · {s.count}{L.timesUnit}
                </AppText>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState inline variant="fasting" message={L.noRecords} />
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
