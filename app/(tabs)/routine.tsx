import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { RoutineItem } from '@/components/RoutineItem';
import { RoutineModal } from '@/components/RoutineModal';
import { SwipeToDelete } from '@/components/SwipeToDelete';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type Routine, type Weekday, useRoutineStore } from '@/stores/useRoutineStore';

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function getTodayDay(): Weekday {
  return new Date().getDay() as Weekday;
}

export default function RoutineScreen() {
  const c = useThemeColors();
  const { routines, addRoutine, updateRoutine, removeRoutine, reorderRoutines } = useRoutineStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Routine | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const today = getTodayDay();
  const todayRoutines = routines
    .filter((r) => r.repeatDays.includes(today))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const otherRoutines = routines
    .filter((r) => !r.repeatDays.includes(today))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // 드래그 후 전체 순서 재정렬 (오늘·그외 구간 각각 처리)
  function handleTodayReorder({ data }: { data: Routine[] }) {
    const merged = [
      ...data,
      ...otherRoutines,
    ].map((r, i) => ({ ...r, order: i }));
    reorderRoutines(merged);
  }

  function handleOtherReorder({ data }: { data: Routine[] }) {
    const merged = [
      ...todayRoutines,
      ...data,
    ].map((r, i) => ({ ...r, order: i }));
    reorderRoutines(merged);
  }

  function renderRoutineItem(
    isCompleted: (id: string) => boolean,
    onToggle: (id: string) => void,
    isToday: boolean,
  ) {
    return function ({ item, drag, isActive }: RenderItemParams<Routine>) {
      return (
        <ScaleDecorator>
          <SwipeToDelete onDelete={() => removeRoutine(item.id)}>
            <View style={{ opacity: isActive ? 0.85 : 1 }}>
              <RoutineItem
                routine={item}
                isCompleted={isCompleted(item.id)}
                onToggle={() => onToggle(item.id)}
                onLongPress={drag}
                onPress={() => openEdit(item)}
              />
              <Divider />
            </View>
          </SwipeToDelete>
        </ScaleDecorator>
      );
    };
  }

  const isEmpty = routines.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <AppText variant="title">루틴</AppText>
        <Pressable onPress={openAdd} hitSlop={8}>
          <AppIcon name="Plus" size={22} />
        </Pressable>
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <AppText variant="body" tone="tertiary" style={{ textAlign: 'center' }}>
            되고 싶은 내 모습을 추가해보세요
          </AppText>
          <Pressable onPress={openAdd}>
            <AppText variant="caption" tone="secondary">
              루틴 추가하기
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* 오늘 루틴 */}
          {todayRoutines.length > 0 && (
            <>
              <AppText
                variant="caption"
                tone="tertiary"
                style={{ marginTop: 16, marginBottom: 4, paddingHorizontal: 20 }}
              >
                오늘 · {WEEKDAYS_KO[today]}요일
              </AppText>
              <View style={{ paddingHorizontal: 20 }}>
                <DraggableFlatList
                  data={todayRoutines}
                  keyExtractor={(r) => r.id}
                  onDragEnd={handleTodayReorder}
                  renderItem={renderRoutineItem(
                    (id) => completed.has(id),
                    toggleCompleted,
                    true,
                  )}
                  scrollEnabled={false}
                  activationDistance={8}
                />
              </View>
            </>
          )}

          {/* 그 외 루틴 */}
          {otherRoutines.length > 0 && (
            <>
              <AppText
                variant="caption"
                tone="disabled"
                style={{ marginTop: 24, marginBottom: 4, paddingHorizontal: 20 }}
              >
                그 외
              </AppText>
              <View style={{ paddingHorizontal: 20 }}>
                <DraggableFlatList
                  data={otherRoutines}
                  keyExtractor={(r) => r.id}
                  onDragEnd={handleOtherReorder}
                  renderItem={renderRoutineItem(
                    () => false,
                    () => {},
                    false,
                  )}
                  scrollEnabled={false}
                  activationDistance={8}
                />
              </View>
            </>
          )}
        </ScrollView>
      )}

      <RoutineModal
        visible={modalVisible}
        initial={editTarget ?? undefined}
        onSave={handleSave}
        onDelete={editTarget ? () => { removeRoutine(editTarget.id); setModalVisible(false); } : undefined}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
