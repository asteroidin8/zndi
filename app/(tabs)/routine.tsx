import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { RoutineItem } from '@/components/RoutineItem';
import { RoutineModal } from '@/components/RoutineModal';
import { SwipeActions } from '@/components/SwipeActions';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { spacing } from '@/constants/spacing';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { type Routine, type Weekday, useRoutineStore } from '@/stores/useRoutineStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { runAfterDragAnimation } from '@/utils/deferredReorder';

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const TAB_INDEX = 1 as const;

function getTodayDay(): Weekday {
  return new Date().getDay() as Weekday;
}

export default function RoutineScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { routines, addRoutine, updateRoutine, removeRoutine, reorderRoutines } = useRoutineStore();
  const { toggleCompletion, isCompleted } = useRoutineCompletionStore();
  const { seenHints, markHintSeen } = useSettingsStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Routine | null>(null);
  const [undoTarget, setUndoTarget] = useState<Routine | null>(null);

  const today = getTodayDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = routines
    .filter((r) => r.repeatDays.includes(today))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const otherRoutines = routines
    .filter((r) => !r.repeatDays.includes(today))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const allTodayComplete =
    todayRoutines.length > 0 && todayRoutines.every((r) => isCompleted(r.id, todayStr));

  const showSwipeHint = !seenHints.swipeActions && routines.length > 0;

  function openAdd() {
    setEditTarget(null);
    setModalVisible(true);
  }

  function openEdit(routine: Routine) {
    setEditTarget(routine);
    setModalVisible(true);
  }

  function handleSave(data: { name: string; repeatDays: Weekday[]; reminderTime: string | null }) {
    if (editTarget) {
      updateRoutine(editTarget.id, data);
    } else {
      addRoutine({
        id: String(Date.now()),
        createdAt: Date.now(),
        order: routines.length,
        ...data,
      });
    }
    setModalVisible(false);
  }

  function toggleCompleted(id: string) {
    toggleCompletion(id, todayStr);
  }

  function handleTodayReorder({ data }: { data: Routine[] }) {
    runAfterDragAnimation(() => {
      reorderRoutines([...data, ...otherRoutines].map((r, i) => ({ ...r, order: i })));
    });
  }

  function handleOtherReorder({ data }: { data: Routine[] }) {
    runAfterDragAnimation(() => {
      reorderRoutines([...todayRoutines, ...data].map((r, i) => ({ ...r, order: i })));
    });
  }

  function renderRoutineItem(onToggle: (id: string) => void, allowComplete: boolean) {
    return function ({ item, drag }: RenderItemParams<Routine>) {
      const completed = isCompleted(item.id, todayStr);

      return (
        <ScaleDecorator activeScale={1.02}>
          <SwipeActions
            onDelete={() => {
              setUndoTarget(item);
              removeRoutine(item.id);
            }}
            onComplete={
              allowComplete
                ? () => {
                    if (!completed) toggleCompleted(item.id);
                  }
                : undefined
            }
          >
            <View>
              <RoutineItem
                routine={item}
                isCompleted={completed}
                onToggle={() => onToggle(item.id)}
                onLongPress={drag}
                onPress={() => openEdit(item)}
              />
              <Divider />
            </View>
          </SwipeActions>
        </ScaleDecorator>
      );
    };
  }

  const isEmpty = routines.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <AppText variant="title">루틴</AppText>
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 }}>
          <EmptyIllustration variant="routine" />
          <AppText variant="body" tone="tertiary" style={{ textAlign: 'center' }}>
            되고 싶은 내 모습을 추가해보세요
          </AppText>
          <Pressable onPress={openAdd} accessibilityRole="button" accessibilityLabel="루틴 추가하기">
            <AppText variant="caption" tone="secondary" style={{ textDecorationLine: 'underline' }}>
              루틴 추가하기
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {allTodayComplete && (
            <View
              style={{
                marginHorizontal: spacing.screen,
                marginTop: 8,
                marginBottom: spacing.xs,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: c.surfaceSubtle,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <AppText variant="body" style={{ fontWeight: '700' }}>
                오늘 루틴을 모두 완료했어요
              </AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                내일도 이어가면 스트릭이 쌓여요
              </AppText>
            </View>
          )}

          {todayRoutines.length > 0 && (
            <>
              <AppText
                variant="caption"
                tone="tertiary"
                style={{ marginTop: spacing.card, marginBottom: spacing.xs, paddingHorizontal: spacing.screen }}
              >
                오늘 · {WEEKDAYS_KO[today]}요일
              </AppText>
              <View style={{ paddingHorizontal: spacing.screen }}>
                <DraggableFlatList
                  data={todayRoutines}
                  keyExtractor={(r) => r.id}
                  onDragEnd={handleTodayReorder}
                  renderItem={renderRoutineItem(toggleCompleted, true)}
                  scrollEnabled={false}
                  activationDistance={4}
                />
              </View>
            </>
          )}

          {otherRoutines.length > 0 && (
            <>
              <AppText
                variant="caption"
                tone="disabled"
                style={{ marginTop: spacing.section, marginBottom: spacing.xs, paddingHorizontal: spacing.screen }}
              >
                그 외
              </AppText>
              <View style={{ paddingHorizontal: spacing.screen }}>
                <DraggableFlatList
                  data={otherRoutines}
                  keyExtractor={(r) => r.id}
                  onDragEnd={handleOtherReorder}
                  renderItem={renderRoutineItem(() => {}, false)}
                  scrollEnabled={false}
                  activationDistance={4}
                />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {!isEmpty && (
        <FloatingAddButton onPress={openAdd} accessibilityLabel="루틴 추가" />
      )}

      <Coachmark
        visible={showSwipeHint}
        message="← 삭제 · 완료 → 스와이프 · 길게 눌러 편집"
        onDismiss={() => {
          markHintSeen('swipeActions');
          markHintSeen('longPressEdit');
        }}
      />

      <RoutineModal
        visible={modalVisible}
        initial={editTarget ?? undefined}
        onSave={handleSave}
        onDelete={editTarget ? () => { removeRoutine(editTarget.id); setModalVisible(false); } : undefined}
        onClose={() => setModalVisible(false)}
      />
      <UndoSnackbar
        message="루틴이 삭제됐어요"
        visible={undoTarget !== null}
        onUndo={() => undoTarget && addRoutine(undoTarget)}
        onDismiss={() => setUndoTarget(null)}
      />
    </SafeAreaView>
  );
}
