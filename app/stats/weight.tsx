import { useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { WeightLineChart } from '@/components/WeightLineChart';
import { WeightRecordModal } from '@/components/WeightRecordModal';
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { STATS_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/stores/useUserStore';
import { formatMetric } from '@/utils/formatMetric';

const L = STATS_LABELS;
const SCREEN_WIDTH = Dimensions.get('window').width;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function WeightDetailScreen() {
  const c = useThemeColors();
  const { profile, weightRecords, addWeightRecord, removeWeightRecord } = useUserStore();
  const [modalVisible, setModalVisible] = useState(false);

  const currentWeight = profile.weightKg;
  const targetWeight = profile.targetWeightKg;

  const diff = useMemo(() => {
    if (currentWeight == null || targetWeight == null) return null;
    return Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10;
  }, [currentWeight, targetWeight]);

  const diffLabel = useMemo(() => {
    if (diff == null || currentWeight == null || targetWeight == null) return '-';
    if (diff === 0) return L.weightAtGoal;
    return `${diff} ${L.weightUnit}`;
  }, [diff, currentWeight, targetWeight]);

  const chartData = useMemo(() => {
    const recent = weightRecords.slice(-14);
    return recent.map((r) => ({
      label: r.date.slice(5).replace('-', '/'),
      value: r.weightKg,
    }));
  }, [weightRecords]);

  function handleSave(date: string, weightKg: number) {
    const existing = weightRecords.find((r) => r.date === date);
    if (existing) {
      removeWeightRecord(existing.id);
    }
    addWeightRecord({
      id: generateId(),
      date,
      weightKg,
      createdAt: Date.now(),
    });
    setModalVisible(false);
  }

  function handleDelete(id: string) {
    Alert.alert(L.deleteAlertTitle, L.deleteAlertMessage, [
      { text: L.cancel, style: 'cancel' },
      {
        text: L.delete,
        style: 'destructive',
        onPress: () => removeWeightRecord(id),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title={L.detailWeight} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard
            label={L.currentWeight}
            value={formatMetric(currentWeight, L.weightUnit)}
          />
          <StatsSummaryCard
            label={L.targetWeight}
            value={formatMetric(targetWeight, L.weightUnit)}
          />
          <StatsSummaryCard label={L.weightDiff} value={diffLabel} />
        </View>

        {chartData.length >= 2 && (
          <View style={{ gap: 8 }}>
            <AppText variant="caption" tone="tertiary">
              {L.weightChartTitle}
            </AppText>
            <WeightLineChart
              data={chartData}
              width={SCREEN_WIDTH - 40}
              height={160}
              targetValue={targetWeight}
              unit={L.weightUnit}
            />
          </View>
        )}

        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="caption" tone="tertiary">
              {L.weightRecordTitle}
            </AppText>
            <Pressable
              onPress={() => setModalVisible(true)}
              hitSlop={8}
              style={{ padding: 4 }}
              accessibilityLabel="체중 기록 추가"
            >
              <AppIcon name="Plus" size={18} color={c.primary} />
            </Pressable>
          </View>

          {weightRecords.length > 0 ? (
            <View style={{ gap: 0 }}>
              {[...weightRecords].reverse().map((record) => (
                <Pressable
                  key={record.id}
                  onLongPress={() => handleDelete(record.id)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: c.borderNeutral,
                  }}
                >
                  <AppText variant="body">{record.date}</AppText>
                  <AppText variant="body" style={{ fontWeight: '600' }}>
                    {record.weightKg.toFixed(1)} {L.weightUnit}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState inline variant="stats" message={L.noRecords} />
          )}
        </View>
      </ScrollView>

      <WeightRecordModal
        visible={modalVisible}
        initialWeight={currentWeight ?? 70}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
