import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { BarChart, type BarChartItem } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { STATS_LABELS, WEEKDAY_SHORT } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import type { Weekday } from '@/types';
import { toDateStr } from '@/utils/homeDailyBoard';

const L = STATS_LABELS;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RoutineDetailScreen() {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { getStreak, isCompleted } = useRoutineCompletionStore();

  const now = new Date();
  const todayWeekday = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const todayRoutines = routines.filter((r) => r.repeatDays.includes(todayWeekday));
  const maxStreak = routines.reduce((max, r) => Math.max(max, getStreak(r.id, r.repeatDays)), 0);

  const todayStr = toDateStr(new Date());
  const last7Days: BarChartItem[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = toDateStr(d);
    const dayOfWeek = d.getDay() as Weekday;
    const scheduled = routines.filter((r) => r.repeatDays.includes(dayOfWeek));
    const completed = scheduled.filter((r) => isCompleted(r.id, ds)).length;
    return {
      label: WEEKDAY_SHORT[d.getDay()],
      value: completed,
      isToday: ds === todayStr,
    };
  });
  const hasChartData = last7Days.some((d) => d.value > 0);

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
        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard label={L.totalRoutines} value={`${routines.length}${L.countUnit}`} />
          <StatsSummaryCard label={L.todayRoutines} value={`${todayRoutines.length}${L.countUnit}`} />
          <StatsSummaryCard
            label={L.maxStreak}
            value={maxStreak > 0 ? `${maxStreak}${L.dayUnit}` : '-'}
          />
        </View>

        {hasChartData && (
          <View style={{ gap: 8 }}>
            <AppText variant="caption" tone="tertiary">
              최근 7일 완료 수
            </AppText>
            <BarChart data={last7Days} width={SCREEN_WIDTH - 40} height={130} unit="개" />
          </View>
        )}

        {routines.length > 0 ? (
          <View style={{ gap: 8 }}>
            {routines.map((r) => {
              const streak = getStreak(r.id, r.repeatDays);
              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
      </ScrollView>
    </SafeAreaView>
  );
}
