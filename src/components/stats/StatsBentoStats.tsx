import { useMemo } from 'react';
import { View } from 'react-native';

import { AnimatedNumber } from '@/components/AnimatedNumber';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { spacing } from '@/constants/spacing';
import { STATS_BENTO } from '@/constants/copy';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useBoardStore } from '@/stores/useBoardStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { buildBoardRoutineData } from '@/utils/boardRoutineStats';
import { getMonthRoutineStats } from '@/utils/contributionGrid';
import { getRoutineStreakDays } from '@/utils/homeDailyBoard';

function StatCard({ label, value, suffix, glow }: { label: string; value: number | null; suffix: string; glow?: boolean }) {
  const c = useThemeColors();
  return (
    <Card glow={glow ? 'soft' : false} style={{ flex: 1, gap: spacing.xs, padding: spacing.item }}>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
      {value !== null ? (
        <AnimatedNumber
          value={value}
          suffix={suffix}
          variant="body"
          style={{ fontWeight: '700', color: c.primary }}
        />
      ) : (
        <AppText variant="body" style={{ fontWeight: '700', color: c.primary }}>
          —
        </AppText>
      )}
    </Card>
  );
}

/** 통계 — 연속 · 이번 달 · 달성률 */
export function StatsBentoStats() {
  const routines = useRoutineStore((s) => s.routines);
  useRoutineCompletionStore((s) => s.completions);
  const { isCompleted } = useRoutineCompletionStore.getState();
  const { user } = useAuth();
  const boardRoutines = useBoardStore((s) => s.routines);
  const boardLogs = useBoardStore((s) => s.logs);

  const boardData = useMemo(
    () => (user ? buildBoardRoutineData(boardRoutines, boardLogs, user.id) : undefined),
    [boardRoutines, boardLogs, user],
  );

  const streak = getRoutineStreakDays(routines, isCompleted, boardData);
  const month = getMonthRoutineStats(routines, isCompleted, undefined, boardData);
  const rate = month.daysWithRoutines > 0 ? Math.round(month.rate * 100) : 0;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <StatCard
        label={STATS_BENTO.streak}
        value={streak > 0 ? streak : null}
        suffix="일"
        glow={streak >= 7}
      />
      <StatCard
        label={STATS_BENTO.monthDays}
        value={month.daysFullyComplete > 0 ? month.daysFullyComplete : null}
        suffix="일"
        glow={month.daysFullyComplete >= 20}
      />
      <StatCard
        label={STATS_BENTO.achievementRate}
        value={month.daysWithRoutines > 0 ? rate : null}
        suffix="%"
        glow={rate >= 80}
      />
    </View>
  );
}
