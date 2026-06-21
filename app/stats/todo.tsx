import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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

const L = STATS_LABELS;

export default function TodoDetailScreen() {
  const c = useThemeColors();
  const { todos } = useTodoStore();

  const completedTodos = todos.filter((t) => t.completedAt !== null).length;
  const activeTodos = todos.filter((t) => t.completedAt === null).length;
  const totalHighPriority = todos.filter((t) => t.priority === 'high').length;
  const completedHighPriority = todos.filter((t) => t.priority === 'high' && !!t.completedAt).length;
  const completionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  const byPriority = (['high', 'medium', 'low'] as const).map((p) => {
    const total = todos.filter((t) => t.priority === p).length;
    const done = todos.filter((t) => t.priority === p && !!t.completedAt).length;
    return { priority: p, total, done };
  });

  const priorityLabel = { high: '높음', medium: '보통', low: '낮음' } as const;
  const priorityColor = (p: 'high' | 'medium' | 'low') =>
    p === 'high' ? c.priorityHigh : p === 'medium' ? c.priorityMid : c.priorityLow;

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
        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard label={L.completionRate} value={`${completionRate}%`} />
          <StatsSummaryCard
            label={L.importantTodos}
            value={totalHighPriority > 0 ? `${completedHighPriority}/${totalHighPriority}` : '-'}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.gap }}>
          <StatsSummaryCard label="진행 중" value={`${activeTodos}${L.countUnit}`} />
          <StatsSummaryCard label={L.completed} value={`${completedTodos}${L.countUnit}`} />
        </View>

        {todos.length > 0 && (
          <View style={{ gap: 8 }}>
            <AppText variant="caption" tone="tertiary">
              전체 달성률
            </AppText>
            <ProgressBar value={completionRate} height={8} />
          </View>
        )}

        {todos.length > 0 ? (
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
