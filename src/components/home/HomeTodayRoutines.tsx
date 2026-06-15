import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { RoutineItem } from '@/components/RoutineItem';
import { SectionHeader } from '@/components/SectionHeader';
import { spacing } from '@/constants/spacing';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { type Routine, type Weekday, useRoutineStore } from '@/stores/useRoutineStore';

type Props = {
  onViewAll: () => void;
};

function getTodayRoutines(routines: Routine[]) {
  const today = new Date().getDay() as Weekday;
  return routines
    .filter((r) => r.repeatDays.includes(today))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function HomeTodayRoutines({ onViewAll }: Props) {
  const { routines } = useRoutineStore();
  const { toggleCompletion, isCompleted } = useRoutineCompletionStore();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = getTodayRoutines(routines);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Today" />
        {todayRoutines.length > 0 && (
          <Pressable onPress={onViewAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="루틴 전체 보기">
            <AppText variant="caption" tone="tertiary">
              전체
            </AppText>
          </Pressable>
        )}
      </View>

      {todayRoutines.length === 0 ? (
        <Card>
          <AppText variant="body" tone="secondary">
            오늘 예정된 루틴이 없어요
          </AppText>
        </Card>
      ) : (
        <Card padded={false}>
          {todayRoutines.map((routine, index) => (
            <View key={routine.id}>
              <View style={{ paddingHorizontal: spacing.card }}>
                <RoutineItem
                  routine={routine}
                  isCompleted={isCompleted(routine.id, todayStr)}
                  onToggle={() => toggleCompletion(routine.id, todayStr)}
                  onPress={() => toggleCompletion(routine.id, todayStr)}
                />
              </View>
              {index < todayRoutines.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}
