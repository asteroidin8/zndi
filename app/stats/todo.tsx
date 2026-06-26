import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { STATS_LABELS } from '@/constants/statsLabels';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTodoStore } from '@/stores/useTodoStore';
import { type Period, getPeriodRange } from '@/utils/periodRange';

const L = STATS_LABELS;

export default function TodoDetailScreen() {
  const c = useThemeColors();
  const allTodos = useTodoStore((s) => s.todos);
  const todos = allTodos.filter((t) => !t.deletedAt);

  const [period, setPeriod] = useState<Period>('weekly');
  const [offset, setOffset] = useState(0);

  const { start, end, label: periodLabel } = getPeriodRange(period, offset);
  const startTs = start.getTime();
  const endTs = end.getTime();

  const completedInPeriod = todos.filter(
    (t) => t.completedAt !== null && t.completedAt >= startTs && t.completedAt < endTs,
  );
  const activeTodos = todos.filter((t) => t.completedAt === null);
  const isCurrent = offset === 0;
  const totalForRate = isCurrent ? completedInPeriod.length + activeTodos.length : completedInPeriod.length;
  const completionRate = totalForRate > 0 ? Math.round((completedInPeriod.length / totalForRate) * 100) : 0;

  const highInPeriod = completedInPeriod.filter((t) => t.priority === 'high').length;
  const totalHigh = isCurrent
    ? todos.filter((t) => t.priority === 'high' && (t.completedAt === null || (t.completedAt >= startTs && t.completedAt < endTs))).length
    : completedInPeriod.filter((t) => t.priority === 'high').length;

  const byPriority = (['high', 'mid', 'low'] as const).map((p) => {
    const done = completedInPeriod.filter((t) => t.priority === p).length;
    const total = isCurrent
      ? todos.filter((t) => t.priority === p && (t.completedAt === null || (t.completedAt !== null && t.completedAt >= startTs && t.completedAt < endTs))).length
      : done;
    return { priority: p, total, done };
  });

  const priorityLabel = { high: '높음', mid: '보통', low: '낮음' } as const;
  const priorityColor = (p: 'high' | 'mid' | 'low') =>
    p === 'high' ? c.priorityHigh : p === 'mid' ? c.priorityMid : c.priorityLow;

  function switchPeriod(p: Period) {
    setPeriod(p);
    setOffset(0);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title={L.detailTodo} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.screen,
          gap: spacing.section,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['weekly', 'monthly'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => switchPeriod(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: period === p ? c.primary : c.surfaceMuted,
              }}
            >
              <AppText
                variant="caption"
                style={{ color: period === p ? '#fff' : c.inkSecondary, fontWeight: '600' }}
              >
                {p === 'weekly' ? '주간' : '월간'}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={8} style={{ padding: 4 }}>
            <AppIcon name="ChevronLeft" size={18} color={c.inkSecondary} />
          </Pressable>
          <AppText variant="body" style={{ fontWeight: '700', minWidth: 120, textAlign: 'center' }}>
            {periodLabel}
          </AppText>
          <Pressable
            onPress={() => setOffset((o) => o + 1)}
            hitSlop={8}
            style={{ padding: 4, opacity: isCurrent ? 0.3 : 1 }}
            disabled={isCurrent}
          >
            <AppIcon name="ChevronRight" size={18} color={c.inkSecondary} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard label={L.completionRate} value={isCurrent ? `${completionRate}%` : `${completedInPeriod.length}${L.countUnit}`} />
          <StatsSummaryCard
            label={L.importantTodos}
            value={totalHigh > 0 ? `${highInPeriod}/${totalHigh}` : '-'}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          {isCurrent && (
            <StatsSummaryCard label="진행 중" value={`${activeTodos.length}${L.countUnit}`} />
          )}
          <StatsSummaryCard label={L.completed} value={`${completedInPeriod.length}${L.countUnit}`} />
        </View>

        {isCurrent && totalForRate > 0 && (
          <View style={{ gap: 8 }}>
            <AppText variant="caption" tone="tertiary">
              {period === 'weekly' ? '주간' : '월간'} 달성률
            </AppText>
            <ProgressBar value={completionRate} height={8} />
          </View>
        )}

        {completedInPeriod.length > 0 || (isCurrent && todos.length > 0) ? (
          <View style={{ gap: 12 }}>
            <AppText variant="body" style={{ fontWeight: '700' }}>
              우선순위별
            </AppText>
            {byPriority.map(({ priority, total, done }) => {
              const rate = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Card key={priority}>
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: priorityColor(priority),
                          }}
                        />
                        <AppText variant="body" style={{ fontWeight: '600' }}>
                          {priorityLabel[priority]}
                        </AppText>
                      </View>
                      <AppText variant="caption" tone="secondary">
                        {done}/{total}
                      </AppText>
                    </View>
                    {total > 0 && (
                      <ProgressBar value={rate} height={6} color={priorityColor(priority)} />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <EmptyState inline variant="todo" message={L.noRecords} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
