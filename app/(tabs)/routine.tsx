import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { EditBottomBar } from '@/components/EditBottomBar';
import { EmptyState } from '@/components/EmptyState';
import { GroupHeader } from '@/components/GroupHeader';
import { RoutineItem } from '@/components/RoutineItem';
import { RoutineModal } from '@/components/RoutineModal';
import { SpeedDialFab } from '@/components/SpeedDialFab';
import { SwipeActions } from '@/components/SwipeActions';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { UngroupedHeader } from '@/components/UngroupedHeader';
import { radius, spacing } from '@/constants/spacing';
import { DAY_LABELS } from '@/constants/statsLabels';
import { registerBackHandler, useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useEditMode } from '@/hooks/useEditMode';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert, appPrompt } from '@/stores/useAlertStore';
import { useProStore } from '@/stores/useProStore';
import { FREE_LIMITS } from '@/hooks/useProGating';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  type Routine,
  type RoutineGroup,
  type Weekday,
  useRoutineStore,
} from '@/stores/useRoutineStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { localDateStr } from '@/utils/dateFormat';
import { uniqueId } from '@/utils/uniqueId';
import { runAfterDragAnimation } from '@/utils/deferredReorder';
import { formatRepeatLabel, isRoutineScheduledForDate } from '@/utils/routineSchedule';
import { compareBySectionThenOrder } from '@/utils/sectionSort';

const TAB_INDEX = 1 as const;

function sortRoutinesBySection(routines: Routine[]): Routine[] {
  return [...routines].sort(compareBySectionThenOrder);
}

// ── Unified drag list types ──

type GroupPosition = 'first' | 'middle' | 'last' | 'only';

type ListItem =
  | { type: 'group-header'; key: string; group: RoutineGroup; completedCount: number; totalCount: number; hasVisibleItems: boolean }
  | { type: 'group-empty'; key: string; groupId: string }
  | { type: 'routine'; key: string; routine: Routine; groupPosition: GroupPosition | null; sectionLabel: string | null }
  | { type: 'ungrouped-header'; key: string };

// ── Main ──

export default function RoutineScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const allRoutines = useRoutineStore((s) => s.routines);
  const groups = useRoutineStore((s) => s.groups);
  const completions = useRoutineCompletionStore((s) => s.completions);
  const isPro = useProStore((s) => s.isPro);
  const seenHints = useSettingsStore((s) => s.seenHints);
  const {
    addRoutine, updateRoutine, removeRoutine, removeRoutines,
    reorderRoutines, reorderGroups, addGroup, updateGroup, removeGroup, toggleGroupCollapsed, batchUpdateRoutines,
  } = useRoutineStore.getState();
  const { toggleCompletion, isCompleted } = useRoutineCompletionStore.getState();
  const { markHintSeen } = useSettingsStore.getState();
  const routines = useMemo(() => allRoutines.filter((r) => !r.deletedAt), [allRoutines]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Routine | null>(null);
  const [undoTarget, setUndoTarget] = useState<Routine | null>(null);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const { setTabBarVisible } = useTabNavigation();
  const { editMode, selectedIds, enterEditMode: _enterEditMode, exitEditMode: _exitEditMode, toggleSelection, toggleSelectAll } = useEditMode();
  const enterEditMode = useCallback(() => { _enterEditMode(); setTabBarVisible(false); }, [_enterEditMode, setTabBarVisible]);
  const exitEditMode = useCallback(() => { _exitEditMode(); setTabBarVisible(true); }, [_exitEditMode, setTabBarVisible]);
  useEffect(() => {
    if (!editMode) return;
    return registerBackHandler(TAB_INDEX, () => { exitEditMode(); return true; });
  }, [editMode, exitEditMode]);
  const [arrangeMode, setArrangeMode] = useState(false);
  const enterArrangeMode = useCallback(() => { setArrangeMode(true); setTabBarVisible(false); }, [setTabBarVisible]);
  const exitArrangeMode = useCallback(() => { setArrangeMode(false); setTabBarVisible(true); }, [setTabBarVisible]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetGroupId, setDragTargetGroupId] = useState<string | null>(null);
  const dragFromRef = useRef(-1);
  const dragSourceGroupRef = useRef<string | null>(null);
  const prevDragTargetRef = useRef<string | null>(null);

  const [todayDate, setTodayDate] = useState(() => new Date());
  const todayStr = useMemo(() => localDateStr(todayDate), [todayDate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const now = new Date();
        if (localDateStr(now) !== localDateStr(todayDate)) setTodayDate(now);
      }
    });
    return () => sub.remove();
  }, [todayDate]);

  const hasGroups = groups.length > 0;
  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);
  const groupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const allRoutinesSorted = useMemo(() => [...routines].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [routines]);
  const ungroupedRoutines = useMemo(() => allRoutinesSorted.filter((r) => !r.groupId || !groupIds.has(r.groupId)), [allRoutinesSorted, groupIds]);

  const todayRoutines = useMemo(() => ungroupedRoutines.filter((r) => isRoutineScheduledForDate(r, todayDate)), [ungroupedRoutines, todayDate]);
  const otherRoutines = useMemo(() => ungroupedRoutines.filter((r) => !isRoutineScheduledForDate(r, todayDate)), [ungroupedRoutines, todayDate]);

  const allTodayComplete = useMemo(() => {
    const todayAll = routines.filter((r) => isRoutineScheduledForDate(r, todayDate));
    return todayAll.length > 0 && todayAll.every((r) => isCompleted(r.id, todayStr));
  }, [routines, todayDate, todayStr, completions]);

  const showSwipeHint = !seenHints.swipeActions && routines.length > 0;

  const allRoutineIds = useMemo(() => routines.map((r) => r.id), [routines]);

  const handleSelectAll = useCallback(() => {
    toggleSelectAll(allRoutineIds);
  }, [toggleSelectAll, allRoutineIds]);

  function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    appAlert(
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

  function handleSave(data: { name: string; repeatType: import('@/types').RepeatType; repeatDays: Weekday[]; monthDates: number[]; repeatInterval: number; section: string | null; reminderTime: string | null; groupId: string | null }) {
    if (editTarget) {
      updateRoutine(editTarget.id, data);
    } else {
      addRoutine({
        id: uniqueId(),
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

  function handleAddGroup() {
    if (!isPro && groups.length >= FREE_LIMITS.routineGroups) {
      appAlert('Pro 기능', `Free는 루틴 그룹을 ${FREE_LIMITS.routineGroups}개까지 만들 수 있어요.\n설정 > 멤버십에서 업그레이드할 수 있어요.`);
      return;
    }
    appPrompt('그룹 추가', '', (name) => {
      addGroup({
        id: uniqueId(),
        name: name.trim(),
        order: groups.length,
        collapsed: false,
      });
    }, '그룹 이름');
  }

  function handleRenameGroup(group: RoutineGroup) {
    appPrompt(
      '그룹 이름 변경',
      group.name,
      (text) => updateGroup(group.id, { name: text }),
      '그룹 이름',
    );
  }

  function handleDeleteGroup(group: RoutineGroup) {
    appAlert(
      '그룹 삭제',
      `"${group.name}" 그룹을 삭제할까요?\n그룹 안의 루틴은 유지됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => removeGroup(group.id) },
      ],
    );
  }

  // ── Build unified drag list ──

  const groupCompletionCounts = useMemo(() => {
    const counts: Record<string, { completed: number; total: number }> = {};
    for (const group of sortedGroups) {
      const groupRoutines = allRoutinesSorted.filter((r) => (r.groupId ?? null) === group.id);
      const todayInGroup = groupRoutines.filter((r) => isRoutineScheduledForDate(r, todayDate));
      counts[group.id] = {
        completed: todayInGroup.filter((r) => isCompleted(r.id, todayStr)).length,
        total: todayInGroup.length,
      };
    }
    return counts;
  }, [sortedGroups, allRoutinesSorted, todayDate, todayStr, completions]);

  const dragItems = useMemo<ListItem[]>(() => {
    if (!hasGroups) return [];
    const items: ListItem[] = [];

    for (const group of sortedGroups) {
      const groupRoutines = allRoutinesSorted.filter((r) => (r.groupId ?? null) === group.id);
      const counts = groupCompletionCounts[group.id] ?? { completed: 0, total: 0 };
      const visibleCount = group.collapsed ? 0 : groupRoutines.length;

      items.push({
        type: 'group-header',
        key: `gh-${group.id}`,
        group,
        completedCount: counts.completed,
        totalCount: counts.total,
        hasVisibleItems: visibleCount > 0,
      });

      if (!group.collapsed) {
        const sorted = sortRoutinesBySection(groupRoutines);
        if (sorted.length === 0) {
          items.push({ type: 'group-empty', key: `ge-${group.id}`, groupId: group.id });
        } else {
          let prevSection: string | null | undefined;
          for (let i = 0; i < sorted.length; i++) {
            const pos: GroupPosition =
              sorted.length === 1 ? 'only' : i === 0 ? 'first' : i === sorted.length - 1 ? 'last' : 'middle';
            const curSection = sorted[i].section ?? null;
            const showLabel = curSection !== null && curSection !== prevSection;
            items.push({ type: 'routine', key: sorted[i].id, routine: sorted[i], groupPosition: pos, sectionLabel: showLabel ? curSection : null });
            prevSection = curSection;
          }
        }
      }
    }

    items.push({ type: 'ungrouped-header', key: 'ungrouped-header' });
    const sortedUngrouped = sortRoutinesBySection(ungroupedRoutines);
    let prevUngroupedSection: string | null | undefined;
    for (const routine of sortedUngrouped) {
      const curSection = routine.section ?? null;
      const showLabel = curSection !== null && curSection !== prevUngroupedSection;
      items.push({ type: 'routine', key: routine.id, routine, groupPosition: null, sectionLabel: showLabel ? curSection : null });
      prevUngroupedSection = curSection;
    }

    return items;
  }, [hasGroups, sortedGroups, allRoutinesSorted, ungroupedRoutines, todayDate, todayStr, groupCompletionCounts]);

  const dragItemsRef = useRef(dragItems);
  dragItemsRef.current = dragItems;

  // ── Drag handlers ──

  const handleDragBegin = useCallback((index: number) => {
    dragFromRef.current = index;
    const item = dragItemsRef.current[index];
    dragSourceGroupRef.current = item?.type === 'routine' ? (item.routine.groupId ?? null) : null;
    prevDragTargetRef.current = null;
    setIsDragging(true);
    setDragTargetGroupId(null);
  }, []);

  const handlePlaceholderIndexChange = useCallback((placeholderIndex: number) => {
    const items = dragItemsRef.current;
    const from = dragFromRef.current;
    let targetId: string | null = null;
    for (let i = placeholderIndex; i >= 0; i--) {
      if (i === from) continue;
      const item = items[i];
      if (item.type === 'group-header') { targetId = item.group.id; break; }
      if (item.type === 'ungrouped-header') { targetId = null; break; }
    }
    if (targetId !== prevDragTargetRef.current) {
      prevDragTargetRef.current = targetId;
      setDragTargetGroupId(targetId);
    }
  }, []);

  function handleUnifiedDragEnd({ data }: { data: ListItem[] }) {
    setIsDragging(false);
    setDragTargetGroupId(null);
    prevDragTargetRef.current = null;
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
      } else if (item.type === 'group-empty') {
        // skip empty placeholder
      } else {
        updates.push({ id: item.routine.id, groupId: currentGroupId, order });
        order++;
      }
    }

    runAfterDragAnimation(() => batchUpdateRoutines(updates));
  }

  // ── Arrange mode (group reorder) ──

  type ArrangeItem = { type: 'group-header'; key: string; group: RoutineGroup };

  const arrangeItems = useMemo<ArrangeItem[]>(() => {
    if (!arrangeMode) return [];
    return sortedGroups.map((group) => ({
      type: 'group-header' as const,
      key: `ah-${group.id}`,
      group,
    }));
  }, [arrangeMode, sortedGroups]);

  function handleArrangeDragEnd({ data }: { data: ArrangeItem[] }) {
    runAfterDragAnimation(() => reorderGroups(data.map((item) => item.group)));
  }

  function renderArrangeItem({ item, drag }: RenderItemParams<ArrangeItem>) {
    return (
      <ScaleDecorator activeScale={1.02}>
        <GroupHeader
          group={{ ...item.group, collapsed: true }}
          completedCount={0}
          totalCount={0}
          hasVisibleItems={false}
          showDelete={false}
          arrangeMode
          onDrag={drag}
          onToggleCollapse={() => {}}
          onRename={() => {}}
          onDelete={() => {}}
        />
      </ScaleDecorator>
    );
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
            {formatRepeatLabel(routine)}
          </AppText>
        </View>
      </Pressable>
    );
  }

  function renderRoutineRow(routine: Routine, allowComplete: boolean, drag?: () => void) {
    const completed = isCompleted(routine.id, todayStr);
    const isToday = isRoutineScheduledForDate(routine, todayDate);

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

  function renderUnifiedItem({ item, drag, isActive }: RenderItemParams<ListItem>) {
    if (item.type === 'group-header') {
      return (
        <GroupHeader
          group={item.group}
          completedCount={item.completedCount}
          totalCount={item.totalCount}
          hasVisibleItems={item.hasVisibleItems}
          showDelete={editMode}
          isDropTarget={isDragging && dragTargetGroupId === item.group.id && dragSourceGroupRef.current !== item.group.id}
          onToggleCollapse={() => toggleGroupCollapsed(item.group.id)}
          onRename={() => handleRenameGroup(item.group)}
          onDelete={() => handleDeleteGroup(item.group)}
        />
      );
    }

    if (item.type === 'group-empty') {
      const isTarget = isDragging && dragTargetGroupId === item.groupId && dragSourceGroupRef.current !== item.groupId;
      return (
        <View
          style={{
            marginHorizontal: spacing.screen,
            paddingVertical: spacing.card,
            paddingHorizontal: spacing.screen,
            backgroundColor: isTarget ? `${c.primary}08` : c.surfaceSubtle,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: isTarget ? c.primary : c.borderNeutral,
            borderBottomLeftRadius: radius.md,
            borderBottomRightRadius: radius.md,
            alignItems: 'center',
          }}
        >
          <AppText variant="caption" tone="disabled">
            루틴을 여기로 드래그하세요
          </AppText>
        </View>
      );
    }

    if (item.type === 'ungrouped-header') {
      return <UngroupedHeader count={ungroupedRoutines.length} />;
    }

    const routine = item.routine;
    const gp = item.groupPosition;
    const sectionLabel = item.sectionLabel;
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

    const sectionHeader = sectionLabel ? (
      <View style={isGrouped ? { marginHorizontal: spacing.screen, paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: c.surfaceSubtle, borderLeftWidth: 1, borderRightWidth: 1, borderColor: c.borderNeutral } : { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
        <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>{sectionLabel}</AppText>
      </View>
    ) : null;

    if (editMode) {
      const selected = selectedIds.has(routine.id);
      return (
        <>
          {sectionHeader}
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
                {formatRepeatLabel(routine)}
              </AppText>
            </View>
          </Pressable>
        </View>
        </>
      );
    }

    const completed = isCompleted(routine.id, todayStr);
    const isToday = isRoutineScheduledForDate(routine, todayDate);

    const dragElevationStyle = isActive ? {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 },
        android: { elevation: 8 },
      }),
    } : undefined;

    return (
      <>
        {sectionHeader}
        <ScaleDecorator activeScale={1.04}>
          <View style={dragElevationStyle}>
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
              </View>
            </SwipeActions>
          </View>
        </ScaleDecorator>
      </>
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
    <View style={{ flex: 1 }}>
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
        {(editMode || arrangeMode) ? (
          <Pressable onPress={editMode ? exitEditMode : exitArrangeMode} hitSlop={8} accessibilityRole="button">
            <AppText variant="body" tone="primary" style={{ fontWeight: '600' }}>
              완료
            </AppText>
          </Pressable>
        ) : !isEmpty && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {groups.length >= 2 && (
              <Pressable onPress={enterArrangeMode} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="그룹 배치">
                <AppIcon name="ArrowUpDown" size={20} color={c.inkTertiary} />
              </Pressable>
            )}
            <Pressable onPress={enterEditMode} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="편집">
              <AppIcon name="Pencil" size={20} color={c.inkTertiary} />
            </Pressable>
          </View>
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          message="되고 싶은 내 모습을 추가해보세요"
          variant="routine"
        />
      ) : arrangeMode ? (
        <DraggableFlatList
          data={arrangeItems}
          keyExtractor={(item) => item.key}
          onDragEnd={handleArrangeDragEnd}
          renderItem={renderArrangeItem}
          activationDistance={4}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : hasGroups ? (
        /* ── Unified DnD list (groups exist) ── */
        <DraggableFlatList
          data={dragItems}
          keyExtractor={(item) => item.key}
          onDragBegin={handleDragBegin}
          onDragEnd={handleUnifiedDragEnd}
          onPlaceholderIndexChange={handlePlaceholderIndexChange}
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
                  오늘 · {DAY_LABELS[todayDate.getDay()]}요일
                </AppText>
              </View>
              {todayRoutines.map(renderSelectableItem)}
              <Divider strong />
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
                  오늘 · {DAY_LABELS[todayDate.getDay()]}요일
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
      ) : !arrangeMode && (
        <SpeedDialFab
          accessibilityLabel="추가 메뉴"
          actions={[
            { label: '루틴 추가', icon: 'Plus', onPress: openAdd },
            { label: '그룹 추가', icon: 'FolderPlus', onPress: handleAddGroup },
          ]}
        />
      )}

      <Coachmark
        visible={showSwipeHint && !editMode && !arrangeMode}
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
    </View>
  );
}
