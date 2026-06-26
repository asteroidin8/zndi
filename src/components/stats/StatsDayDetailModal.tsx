import { Pressable, ScrollView, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { SheetModal } from '@/components/SheetModal';
import { STATS_LABELS } from '@/constants/statsLabels';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { FastingRecord } from '@/types';
import { type DailyFastingSummary, formatHHMM, formatMinutes } from '@/utils/statsHelper';

const L = STATS_LABELS;

type Props = {
  summary: DailyFastingSummary;
  onEditRecord: (record: FastingRecord) => void;
  onClose: () => void;
};

export function StatsDayDetailModal({ summary, onEditRecord, onClose }: Props) {
  const c = useThemeColors();
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');
  return (
    <SheetModal
      visible
      onClose={onClose}
      title={summary.date}
      scrollable={false}
    >
      <AppText variant="caption" tone="tertiary" style={{ marginBottom: 20 }}>
        {L.summaryPrefix} {formatMinutes(summary.totalMinutes)} {L.summarySeparator} {summary.count}
        {L.summarySuffix}
      </AppText>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '50%' }}>
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
                {formatHHMM(r.startedAt, timeFormat)} {L.timeRangeSeparator} {formatHHMM(r.endedAt, timeFormat)}
              </AppText>
            </Pressable>
            {i < summary.records.length - 1 && <Divider />}
          </View>
        ))}
      </ScrollView>
    </SheetModal>
  );
}
