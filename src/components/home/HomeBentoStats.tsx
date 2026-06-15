import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { getMonthRoutineStats } from '@/utils/contributionGrid';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';

function StatCard({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <Card style={{ flex: 1, gap: spacing.xs, padding: spacing.item }}>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
      <AppText variant="body" style={{ fontWeight: '700', color: c.primary }}>
        {value}
      </AppText>
    </Card>
  );
}

export function HomeBentoStats() {
  const { routines } = useRoutineStore();
  const { isCompleted } = useRoutineCompletionStore();
  const streak = getRoutineStreakDays(routines, isCompleted);
  const month = getMonthRoutineStats(routines, isCompleted);

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <StatCard label="Streak" value={streak > 0 ? `${streak}일` : '—'} />
      <StatCard
        label="이번 달"
        value={month.daysFullyComplete > 0 ? `${month.daysFullyComplete}일` : '—'}
      />
      <StatCard
        label="완료율"
        value={month.daysWithRoutines > 0 ? `${Math.round(month.rate * 100)}%` : '—'}
      />
    </View>
  );
}
