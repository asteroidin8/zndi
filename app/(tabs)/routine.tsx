import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { EditBottomBar } from '@/components/EditBottomBar';
import { EmptyState } from '@/components/EmptyState';
import { GroupHeader } from '@/components/GroupHeader';
import { RoutineItem } from '@/components/RoutineItem';
import { RoutineModal } from '@/components/RoutineModal';
import { SheetModal, SheetPrimaryButton } from '@/components/SheetModal';
import { SpeedDialFab } from '@/components/SpeedDialFab';
import { SwipeActions } from '@/components/SwipeActions';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { UngroupedHeader } from '@/components/UngroupedHeader';
import { radius, spacing } from '@/constants/spacing';
import { DAY_LABELS } from '@/constants/statsLabels';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useEditMode } from '@/hooks/useEditMode';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  type Routine,
  type RoutineGroup,
  type Weekday,
  useRoutineStore,
} from '@/stores/useRoutineStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { runAfterDragAnimation } from '@/utils/deferredReorder';

const TAB_INDEX = 1 as const;
const DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

function getTodayDay(): Weekday {
  return new Date().getDay() as Weekday;
}

// ── Unified drag list types ──

type GroupPosition = 'first' | 'middle' | 'last' | 'only';

type ListItem =
  | { type: 'group-header'; key: string; group: RoutineGroup; completedCount: number; totalCount: number; hasVisibleItems: boolean }
  | { type: 'routine'; key: string; routine: Routine; groupPosition: GroupPosition | null }
  | { type: 'ungrouped-header'; key: string };

// ── Main ──

export default function RoutineScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const {
    routines,
    groups,
    addRoutine,
    updateRoutine,
    removeRoutine,
    removeRoutines,
    reorderRoutines,
    addGroup,
    updateGroup,
    removeGroup,
    toggleGroupCollapsed,
    batchUpdateRoutines,
  } = useRoutineStore();
  const { toggleCompletion, isCompleted } = useRoutineCompletionStore();
  const { seenHints, markHintSeen } = useSettingsStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Routine | null>(null);
  const [undoTarget, setUndoTarget] = useState<Routine | null>(null);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const { editMode, selectedIds, enterEditMode, exitEditMode, toggleSelection, toggleSelectAll } = useEditMode();
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const today = useMemo(() => getTodayDay(), []);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const hasGroups = groups.length > 0;
  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);
  const allRoutinesSorted = useMemo(() => [...routines].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [routines]);
  const ungroupedRoutines = useMemo(() => allRoutinesSorted.filter((r) => (r.groupId ?? null) === null), [allRoutinesSorted]);

  const todayRoutines = useMemo(() => ungroupedRoutines.filter((r) => r.repeatDays.includes(today)), [ungroupedRoutines, today]);
  const otherRoutines = useMemo(() => ungroupedRoutines.filter((r) => !r.repeatDays.includes(today)), [ungroupedRoutines, today]);

  const allTodayComplete = (() => {
    const todayAll = routines.filter((r) => r.repeatDays.includes(today));
    return todayAll.length > 0 && todayAll.every((r) => isCompleted(r.id, todayStr));
  })();

  const showSwipeHint = !seenHints.swipeActions && routines.length > 0;

  const allRoutineIds = useMemo(() => routines.map((r) => r.id), [routines]);

  const handleSelectAll = useCallback(() => {
    toggleSelectAll(allRoutineIds);
  }, [toggleSelectAll, allRoutineIds]);

  function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert(
      `${count}개 삭제`,
      `선택한 ${count}개의 루틴을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            removeRoutines(Array.from(selectedIds));
            exitEditMode();
          },
        },
      ],
    );
  }

  // ── CRUD ──

  function openAdd() {
    setEditTarget(null);
    setModalVisible(true);
  }

  function openEdit(routine: Routine) {
    setEditTarget(routine);
    setModalVisible(true);
  }

  function handleSave(data: { name: string; repeatDays: Weekday[]; reminderTime: string | null; groupId: string | null }) {
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

  // ── Group handlers ──

  function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    addGroup({
      id: String(Date.now()),
      name: newGroupName.trim(),
      order: groups.length,
      collapsed: false,
    });
    setNewGroupName('');
    setGroupModalVisible(false);
  }

  function handleRenameGroup(group: RoutineGroup) {
    Alert.prompt?.(
      '그룹 이름 변경',
      '',
      (text) => {
        if (text?.trim()) updateGroup(group.id, { name: text.trim() });
      },
      'plain-text',
      group.name,
    ) ??
      Alert.alert('그룹 관리', group.name, [
        { text: '삭제', style: 'destructive', onPress: () => removeGroup(group.id) },
        { text: '닫기' },
      ]);
  }

  function handleDeleteGroup(group: RoutineGroup) {
    Alert.alert(
      '그룹 삭제',
      `"${group.name}" 그룹을 삭제할까요?\n그룹 안의 루틴은 유지됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => removeGroup(group.id) },
      ],
    );
  }

  // ── Build unified drag list ──

  const dragItems = useMemo<ListItem[]>(() => {
    if (!hasGroups) return [];
    const items: ListItem[] = [];

    for (const group of sortedGroups) {
      const groupRoutines = allRoutinesSorted.filter((r) => (r.groupId ?? null) === group.id);
      const todayInGroup = groupRoutines.filter((r) => r.repeatDays.includes(today));
      const completedInGroup = todayInGroup.filter((r) => isCompleted(r.id, todayStr)).length;
      const visibleCount = group.collapsed ? 0 : groupRoutines.length;

      items.push({
        type: 'group-header',
        key: `gh-${group.id}`,
        group,
        completedCount: completedInGroup,
        totalCount: todayInGroup.length,
        hasVisibleItems: visibleCount > 0,
      });

      if (!group.collapsed) {
        for (let i = 0; i < groupRoutines.length; i++) {
          const pos: GroupPosition =
            groupRoutines.length === 1 ? 'only' : i === 0 ? 'first' : i === groupRoutines.length - 1 ? 'last' : 'middle';
          items.push({ type: 'routine', key: groupRoutines[i].id, routine: groupRoutines[i], groupPosition: pos });
        }
      }
    }

    items.push({ type: 'ungrouped-header', key: 'ungrouped-header' });
    for (const routine of ungroupedRoutines) {
      items.push({ type: 'routine', key: routine.id, routine, groupPosition: null });
    }

    return items;
  }, [hasGroups, sortedGroups, allRoutinesSorted, ungroupedRoutines, today, todayStr, isCompleted]);

  // ── Drag handlers ──

  function handleUnifiedDragEnd({ data }: { data: ListItem[] }) {
    let currentGroupId: string | null = null;
    let order = 0;
    const updates: { id: string; groupId: string | null; order: number }[] = [];

    for (const item of data) {
      if (item.type === 'group-header') {
        currentGroupId = item.group.id;
        order = 0;
      } else if (item.type === 'ungrouped-header') {
        currentGroupId = null;
        order = 0;
      } else {
        updates.push({ id: item.routine.id, groupId: currentGroupId, order });
        order++;
      }
    }

    runAfterDragAnimation(() => batchUpdateRoutines(updates));
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

  // ── Render helpers ──

  function renderSelectableItem(routine: Routine) {
    const selected = selectedIds.has(routine.id);
    return (
      <Pressable
        key={routine.id}
        onPress={() => toggleSelection(routine.id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.screen,
          gap: spacing.item,
          backgroundColor: selected ? `${c.primary}15` : 'transparent',
        }}
      >
        <AppIcon
          name={selected ? 'CheckSquare' : 'Square'}
          size={20}
          color={selected ? c.primary : c.inkDisabled}
        />
        <View style={{ flex: 1 }}>
          <AppText variant="body">{routine.name}</AppText>
          <AppText variant="caption" tone="disabled">
            {routine.repeatDays.map((d) => DAY_SHORT[d]).join('·')}
          </AppText>
        </View>
      </Pressable>
    );
  }

  function renderRoutineRow(routine: Routine, allowComplete: boolean, drag?: () => void) {
    const completed = isCompleted(routine.id, todayStr);
    const isToday = routine.repeatDays.includes(today);

    return (
      <ScaleDecorator activeScale={1.02}>
        <SwipeActions
          onDelete={() => {
            setUndoTarget(routine);
            removeRoutine(routine.id);
          }}
          onComplete={
            allowComplete && isToday
              ? () => { if (!completed) toggleCompleted(routine.id); }
              : undefined
          }
        >
          <View>
            <RoutineItem
              routine={routine}
              isCompleted={isToday ? completed : false}
              onToggle={isToday ? () => toggleCompleted(routine.id) : undefined}
              onLongPress={drag}
              onPress={() => openEdit(routine)}
            />
            <Divider />
          </View>
        </SwipeActions>
      </ScaleDecorator>
    );
  }

  function renderUnifiedItem({ item, drag }: RenderItemParams<ListItem>) {
    if (item.type === 'group-header') {
      return (
        <GroupHeader
          group={item.group}
          completedCount={item.completedCount}
          totalCount={item.totalCount}
          hasVisibleItems={item.hasVisibleItems}
          showDelete={editMode}
          onToggleCollapse={() => toggleGroupCollapsed(item.group.id)}
          onRename={() => handleRenameGroup(item.group)}
          onDelete={() => handleDeleteGroup(item.group)}
        />
      );
    }

    if (item.type === 'ungrouped-header') {
      return <UngroupedHeader count={ungroupedRoutines.length} />;
    }

    const routine = item.routine;
    const gp = item.groupPosition;
    const isGrouped = gp !== null;

    const cardWrapStyle = isGrouped
      ? {
          marginHorizontal: spacing.screen,
          backgroundColor: c.surfaceSubtle,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: gp === 'last' || gp === 'only' ? 1 : 0,
          borderColor: c.borderNeutral,
          borderBottomLeftRadius: gp === 'last' || gp === 'only' ? radius.md : 0,
          borderBottomRightRadius: gp === 'last' || gp === 'only' ? radius.md : 0,
        }
      : undefined;

    if (editMode) {
      const selected = selectedIds.has(routine.id);
      return (
        <View style={cardWrapStyle}>
          <Pressable
            onPress={() => toggleSelection(routine.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.screen,
              gap: spacing.item,
              backgroundColor: selected ? `${c.primary}15` : 'transparent',
            }}
          >
            <AppIcon
              name={selected ? 'CheckSquare' : 'Square'}
              size={20}
              color={selected ? c.primary : c.inkDisabled}
            />
            <View style={{ flex: 1 }}>
              <AppText variant="body">{routine.name}</AppText>
              <AppText variant="caption" tone="disabled">
                {routine.repeatDays.map((d) => DAY_SHORT[d]).join('·')}
              </AppText>
            </View>
          </Pressable>
        </View>
      );
    }

    const completed = isCompleted(routine.id, todayStr);
    const isToday = routine.repeatDays.includes(today);

    return (
      <ScaleDecorator activeScale={1.02}>
        <SwipeActions
          onDelete={() => {
            setUndoTarget(routine);
            removeRoutine(routine.id);
          }}
          onComplete={
            isToday
              ? () => { if (!completed) toggleCompleted(routine.id); }
              : undefined
          }
        >
          <View style={cardWrapStyle}>
            <View style={{ paddingHorizontal: isGrouped ? spacing.screen : 0 }}>
              <RoutineItem
                routine={routine}
                isCompleted={isToday ? completed : false}
                onToggle={isToday ? () => toggleCompleted(routine.id) : undefined}
                onLongPress={drag}
                onPress={() => openEdit(routine)}
              />
            </View>
            {(gp !== 'last' && gp !== 'only') && <Divider />}
          </View>
        </SwipeActions>
      </ScaleDecorator>
    );
  }

  function renderLegacyItem(allowComplete: boolean) {
    return function RoutineListRow({ item, drag }: RenderItemParams<Routine>) {
      return renderRoutineRow(item, allowComplete, drag);
    };
  }

  // ── Layout ──

  const isEmpty = routines.length === 0 && groups.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          paddingTop: spacing.card,
          paddingBottom: spacing.sm,
        }}
      >
        <AppText variant="title">루틴</AppText>
        {!isEmpty && (
          <Pressable onPress={editMode ? exitEditMode : enterEditMode} hitSlop={8} accessibilityRole="button">
            <AppText variant="body" tone={editMode ? 'primary' : 'tertiary'} style={{ fontWeight: '600' }}>
              {editMode ? '완료' : '편집'}
            </AppText>
          </Pressable>
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          message="되고 싶은 내 모습을 추가해보세요"
          variant="routine"
        />
      ) : hasGroups ? (
        /* ── Unified DnD list (groups exist) ── */
        <DraggableFlatList
          data={dragItems}
          keyExtractor={(item) => item.key}
          onDragEnd={handleUnifiedDragEnd}
          renderItem={renderUnifiedItem}
          activationDistance={4}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : editMode ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {todayRoutines.length > 0 && (
            <>
              <View style={{ marginTop: spacing.card, marginBottom: spacing.xs, paddingHorizontal: spacing.screen }}>
                <AppText variant="caption" tone="tertiary">
                  오늘 · {DAY_LABELS[today]}요일
                </AppText>
              </View>
              {todayRoutines.map(renderSelectableItem)}
              <Divider />
            </>
          )}
          {otherRoutines.length > 0 && (
            <>
              <View style={{ marginTop: spacing.card, marginBottom: spacing.xs, paddingHorizontal: spacing.screen }}>
                <AppText variant="caption" tone="disabled">
                  그 외 {otherRoutines.length}
                </AppText>
              </View>
              {otherRoutines.map(renderSelectableItem)}
            </>
          )}
        </ScrollView>
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
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
                paddingHorizontal: spacing.item,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: c.surfaceSubtle,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <AppText variant="body" style={{ fontWeight: '700' }}>
                오늘 잔디 심기 완료!
              </AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                내일도 잔디를 심어보세요
              </AppText>
            </View>
          )}

          {todayRoutines.length > 0 && (() => {
            const completedCount = todayRoutines.filter((r) => isCompleted(r.id, todayStr)).length;
            return (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.card, marginBottom: spacing.xs, paddingHorizontal: spacing.screen }}>
                <AppText variant="caption" tone="tertiary">
                  오늘 · {DAY_LABELS[today]}요일
                </AppText>
                <AppText variant="caption" tone={completedCount === todayRoutines.length ? 'primary' : 'tertiary'} style={{ fontWeight: '600' }}>
                  {completedCount}/{todayRoutines.length}
                </AppText>
              </View>
              <View style={{ paddingHorizontal: spacing.screen }}>
                <DraggableFlatList
                  data={todayRoutines}
                  keyExtractor={(r) => r.id}
                  onDragEnd={handleTodayReorder}
                  renderItem={renderLegacyItem(true)}
                  scrollEnabled={false}
                  activationDistance={4}
                />
              </View>
            </>
            );
          })()}

          {otherRoutines.length > 0 && (
            <>
              <Pressable
                onPress={() => setOtherExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={`그 외 ${otherRoutines.length}개${otherExpanded ? ', 접기' : ', 펼치기'}`}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.section, marginBottom: spacing.xs, paddingHorizontal: spacing.screen, gap: spacing.xs }}
              >
                <AppIcon name={otherExpanded ? 'ChevronDown' : 'ChevronRight'} size={12} color={c.inkDisabled} />
                <AppText variant="caption" tone="disabled">
                  그 외 {otherRoutines.length}
                </AppText>
              </Pressable>
              {otherExpanded && (
                <View style={{ paddingHorizontal: spacing.screen }}>
                  <DraggableFlatList
                    data={otherRoutines}
                    keyExtractor={(r) => r.id}
                    onDragEnd={handleOtherReorder}
                    renderItem={renderLegacyItem(false)}
                    scrollEnabled={false}
                    activationDistance={4}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {editMode ? (
        <EditBottomBar
          selectedCount={selectedIds.size}
          totalCount={routines.length}
          onSelectAll={handleSelectAll}
          onDelete={handleBulkDelete}
        />
      ) : (
        <SpeedDialFab
          accessibilityLabel="추가 메뉴"
          actions={[
            { label: '루틴 추가', icon: 'Plus', onPress: openAdd },
            { label: '그룹 추가', icon: 'FolderPlus', onPress: () => { setNewGroupName(''); setGroupModalVisible(true); } },
          ]}
        />
      )}

      <Coachmark
        visible={showSwipeHint && !editMode}
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

      <SheetModal
        visible={groupModalVisible}
        onClose={() => setGroupModalVisible(false)}
        title="그룹 추가"
        footer={<SheetPrimaryButton label="추가" onPress={handleCreateGroup} disabled={!newGroupName.trim()} />}
      >
        <TextInput
          value={newGroupName}
          onChangeText={setNewGroupName}
          placeholder="그룹 이름"
          placeholderTextColor={c.inkDisabled}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreateGroup}
          style={{
            fontSize: 16,
            color: c.ink,
            borderBottomWidth: 1,
            borderBottomColor: c.border,
            paddingVertical: spacing.sm,
          }}
        />
      </SheetModal>

      <UndoSnackbar
        message="루틴이 삭제됐어요"
        visible={undoTarget !== null}
        onUndo={() => undoTarget && addRoutine(undoTarget)}
        onDismiss={() => setUndoTarget(null)}
      />
    </SafeAreaView>
  );
}
