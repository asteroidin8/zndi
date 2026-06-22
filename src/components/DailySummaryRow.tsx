import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { CompletionCheckbox } from './CompletionCheckbox';
import { TodoPriorityBadge } from './TodoPriorityBadge';
import { useThemeColors } from '@/hooks/useThemeColors';
import { motion } from '@/constants/motion';
import { radius, size, spacing } from '@/constants/spacing';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { localDateStr } from '@/utils/dateFormat';
import { isRoutineScheduledForDate } from '@/utils/routineSchedule';

const MAX_ROUTINES = 5;
const MAX_TODOS = 4;

function getTodayDate() {
  return localDateStr();
}

type Props = {
  onRoutinePress?: () => void;
  onTodoPress?: () => void;
};

export function DailySummaryRow({ onRoutinePress, onTodoPress }: Props) {
  const c = useThemeColors();
  const { routines } = useRoutineStore();
  const { todos, completeTodo } = useTodoStore();
  const { isCompleted, toggleCompletion } = useRoutineCompletionStore();

  const today = getTodayDate();
  const now = new Date();

  const todayRoutines = routines
    .filter((r) => isRoutineScheduledForDate(r, now))
    .sort((a, b) => {
      const aDone = isCompleted(a.id, today) ? 1 : 0;
      const bDone = isCompleted(b.id, today) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return a.order - b.order;
    });

  const incompleteRoutines = todayRoutines.filter((r) => !isCompleted(r.id, today));
  const activeTodos = todos.filter((t) => !t.completedAt);

  const allRoutinesDone =
    todayRoutines.length > 0 && incompleteRoutines.length === 0;

  const hasRoutines = todayRoutines.length > 0;
  const hasTodos = activeTodos.length > 0;

  const completedCount = todayRoutines.length - incompleteRoutines.length;
  const progressRatio = todayRoutines.length > 0 ? completedCount / todayRoutines.length : 0;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(progressRatio, motion.spring.gentle);
  }, [progressRatio, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const routineBarWidth = useSharedValue(3);
  const todoBarWidth = useSharedValue(3);

  const routineBarStyle = useAnimatedStyle(() => ({
    width: routineBarWidth.value,
  }));

  const todoBarStyle = useAnimatedStyle(() => ({
    width: todoBarWidth.value,
  }));

  function pulseRoutineBar() {
    routineBarWidth.value = withSequence(
      withSpring(5, motion.spring.stiff),
      withSpring(3, motion.spring.gentle),
    );
  }

  function pulseTodoBar() {
    todoBarWidth.value = withSequence(
      withSpring(5, motion.spring.stiff),
      withSpring(3, motion.spring.gentle),
    );
  }

  if (!hasRoutines && !hasTodos) return null;

  const cardStyle = {
    backgroundColor: c.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden' as const,
  };

  const headerRowStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.md,
  };

  const itemRowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm + 2,
  };

  const displayRoutines = allRoutinesDone ? [] : incompleteRoutines.slice(0, MAX_ROUTINES);
  const hiddenRoutineCount = Math.max(incompleteRoutines.length - MAX_ROUTINES, 0);

  const displayTodos = activeTodos.slice(0, MAX_TODOS);
  const hiddenTodoCount = Math.max(activeTodos.length - MAX_TODOS, 0);

  return (
    <View style={{ gap: spacing.section }}>
      {hasRoutines && (
        <View
          style={{
            ...cardStyle,
            ...(allRoutinesDone ? { borderColor: `${c.primary}30` } : {}),
          }}
        >
          <Animated.View
            style={[
              { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: c.primary, zIndex: 1 },
              routineBarStyle,
            ]}
          />
          <Pressable
            onPress={onRoutinePress}
            style={headerRowStyle}
            accessibilityRole="button"
            accessibilityLabel="루틴 탭으로 이동"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary }} />
              <AppText
                variant="body"
                style={{
                  fontWeight: '600',
                  ...(allRoutinesDone ? { color: c.primary } : {}),
                }}
              >
                {allRoutinesDone ? '오늘 잔디 심기 완료 ✓' : '오늘의 루틴'}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="caption" tone="tertiary">
                {completedCount}/{todayRoutines.length}
              </AppText>
              <AppIcon name="ChevronRight" size={size.iconSm} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 3, backgroundColor: `${c.primary}15`, marginHorizontal: spacing.card, borderRadius: 2 }}>
            <Animated.View
              style={[
                { height: 3, backgroundColor: c.primary, borderRadius: 2 },
                progressStyle,
              ]}
            />
          </View>

          {displayRoutines.length > 0 && (
            <>
              <View style={{ height: 1, backgroundColor: c.border, marginTop: spacing.sm }} />
              {displayRoutines.map((routine, index) => (
                <View key={routine.id}>
                  <View style={itemRowStyle}>
                    <CompletionCheckbox
                      checked={false}
                      onToggle={() => {
                        toggleCompletion(routine.id, today);
                        pulseRoutineBar();
                      }}
                      size={size.checkboxSm}
                      iconSize={10}
                      label={`${routine.name} 완료`}
                    />
                    <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {routine.name}
                    </AppText>
                  </View>
                  {index < displayRoutines.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: c.border,
                        marginLeft: spacing.card + size.checkboxSm + spacing.sm + 2,
                      }}
                    />
                  )}
                </View>
              ))}
            </>
          )}

          {hiddenRoutineCount > 0 && (
            <Pressable
              onPress={onRoutinePress}
              style={{ paddingHorizontal: spacing.card, paddingVertical: spacing.sm + 2 }}
            >
              <AppText variant="caption" tone="tertiary">
                +{hiddenRoutineCount}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}

      {hasTodos && (
        <View style={cardStyle}>
          <Animated.View
            style={[
              { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: c.primary, zIndex: 1 },
              todoBarStyle,
            ]}
          />
          <Pressable
            onPress={onTodoPress}
            style={headerRowStyle}
            accessibilityRole="button"
            accessibilityLabel="할일 탭으로 이동"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary }} />
              <AppText variant="body" style={{ fontWeight: '600' }}>
                오늘의 할 일
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="caption" tone="tertiary">
                {activeTodos.length}개
              </AppText>
              <AppIcon name="ChevronRight" size={size.iconSm} color={c.inkTertiary} />
            </View>
          </Pressable>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {displayTodos.map((todo, index) => (
            <View key={todo.id}>
              <View style={itemRowStyle}>
                <CompletionCheckbox
                  checked={false}
                  onToggle={() => {
                    completeTodo(todo.id);
                    pulseTodoBar();
                  }}
                  size={size.checkboxSm}
                  iconSize={10}
                  shape="circle"
                  label={`${todo.title} 완료`}
                />
                <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {todo.title}
                </AppText>
                <TodoPriorityBadge priority={todo.priority} />
              </View>
              {index < displayTodos.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: c.border,
                    marginLeft: spacing.card + size.checkboxSm + spacing.sm + 2,
                  }}
                />
              )}
            </View>
          ))}

          {hiddenTodoCount > 0 && (
            <Pressable
              onPress={onTodoPress}
              style={{ paddingHorizontal: spacing.card, paddingVertical: spacing.sm + 2 }}
            >
              <AppText variant="caption" tone="tertiary">
                +{hiddenTodoCount}개 더보기
              </AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
