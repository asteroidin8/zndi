import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { EditBottomBar } from '@/components/EditBottomBar';
import { EmptyState } from '@/components/EmptyState';
import { GroupHeader } from '@/components/GroupHeader';
import { SpeedDialFab } from '@/components/SpeedDialFab';
import { SwipeActions } from '@/components/SwipeActions';
import { TodoEditModal } from '@/components/TodoEditModal';
import { TodoItem } from '@/components/TodoItem';
import { type TodoCreatePayload, TodoModal } from '@/components/TodoModal';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { UngroupedHeader } from '@/components/UngroupedHeader';
import { radius, spacing } from '@/constants/spacing';
import { registerBackHandler, useTabNavigation, useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useEditMode } from '@/hooks/useEditMode';
import { appAlert, appPrompt } from '@/stores/useAlertStore';
import { useProStore } from '@/stores/useProStore';
import { FREE_LIMITS } from '@/hooks/useProGating';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPriorityColor } from '@/utils/dateFormat';
import { runAfterDragAnimation } from '@/utils/deferredReorder';
import { uniqueId } from '@/utils/uniqueId';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { type Todo, type TodoGroup, type TodoPriority, useTodoStore } from '@/stores/useTodoStore';
import { compareBySectionThenOrder } from '@/utils/sectionSort';

type TabFilter = 'active' | 'completed';

const TAB_INDEX = 3 as const;

const PRIORITY_SECTIONS: { key: TodoPriority; label: string }[] = [
  { key: 'high', label: '높음' },
  { key: 'mid', label: '보통' },
  { key: 'low', label: '낮음' },
];

const PRIORITY_ORDER: Record<TodoPriority, number> = { high: 0, mid: 1, low: 2 };

function sortTodosBySection(todos: Todo[]): Todo[] {
  return [...todos].sort(compareBySectionThenOrder);
}

// ── Unified drag list types ──

type GroupPosition = 'first' | 'middle' | 'last' | 'only';

type ListItem =
  | { type: 'group-header'; key: string; group: TodoGroup; completedCount: number; totalCount: number; hasVisibleItems: boolean }
  | { type: 'group-empty'; key: string; groupId: string }
  | { type: 'todo'; key: string; todo: Todo; groupPosition: GroupPosition | null; sectionLabel: string | null }
  | { type: 'ungrouped-header'; key: string };

// ── Small components ──

function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: getPriorityColor(priority, c),
        marginRight: 6,
      }}
    />
  );
}

function PrioritySectionHeader({ label, priority, count }: { label: string; priority: TodoPriority; count: number }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.screen,
        backgroundColor: c.surface,
      }}
    >
      <PriorityBadge priority={priority} />
      <AppText variant="caption" style={{ color: getPriorityColor(priority, c), fontWeight: '700', flex: 1 }}>
        {label}
      </AppText>
      <AppText variant="caption" tone="disabled">
        {count}
      </AppText>
    </View>
  );
}


// ── Main ──

export default function TodoScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const allTodos = useTodoStore((s) => s.todos);
  const groups = useTodoStore((s) => s.groups);
  const isPro = useProStore((s) => s.isPro);
  const seenHints = useSettingsStore((s) => s.seenHints);
  const {
    addTodo, updateTodo, completeTodo, uncompleteTodo, removeTodo, removeTodos,
    reorderTodos, reorderGroups, addGroup, updateGroup, removeGroup, toggleGroupCollapsed, batchUpdateTodos,
  } = useTodoStore.getState();
  const { markHintSeen } = useSettingsStore.getState();
  const todos = useMemo(() => allTodos.filter((t) => !t.deletedAt), [allTodos]);

  const [filter, setFilter] = useState<TabFilter>('active');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  const [undoTarget, setUndoTarget] = useState<Todo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetGroupId, setDragTargetGroupId] = useState<string | null>(null);
  const dragFromRef = useRef(-1);
  const dragSourceGroupRef = useRef<string | null>(null);
  const prevDragTargetRef = useRef<string | null>(null);
  const { setTabBarVisible } = useTabNavigation();
  const { editMode, selectedIds, enterEditMode: _enterEditMode, exitEditMode: _exitEditMode, toggleSelection, toggleSelectAll } = useEditMode();
  const enterEditMode = useCallback(() => { _enterEditMode(); setTabBarVisible(false); }, [_enterEditMode, setTabBarVisible]);
  const exitEditMode = useCallback(() => { _exitEditMode(); setTabBarVisible(true); }, [_exitEditMode, setTabBarVisible]);
  const [arrangeMode, setArrangeMode] = useState(false);
  const enterArrangeMode = useCallback(() => { setArrangeMode(true); setTabBarVisible(false); }, [setTabBarVisible]);
  const exitArrangeMode = useCallback(() => { setArrangeMode(false); setTabBarVisible(true); }, [setTabBarVisible]);

  useEffect(() => {
    if (!editMode) return;
    return registerBackHandler(TAB_INDEX, () => { exitEditMode(); return true; });
  }, [editMode, exitEditMode]);

  const activeTodos = useMemo(() => todos.filter((t) => !t.completedAt), [todos]);
  const completedTodos = useMemo(() => todos.filter((t) => !!t.completedAt), [todos]);
  const showSwipeHint = !seenHints.swipeActions && todos.length > 0;

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);
  const groupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const ungroupedActive = useMemo(() => activeTodos.filter((t) => !t.groupId || !groupIds.has(t.groupId)), [activeTodos, groupIds]);
  const hasGroups = groups.length > 0;

  const visibleTodoIds = useMemo(() => {
    const list = filter === 'active' ? activeTodos : completedTodos;
    return list.map((t) => t.id);
  }, [filter, activeTodos, completedTodos]);

  const handleSelectAll = useCallback(() => {
    toggleSelectAll(visibleTodoIds);
  }, [toggleSelectAll, visibleTodoIds]);

  function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    appAlert(
      `${count}개 삭제`,
      `선택한 ${count}개의 할일을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            removeTodos(Array.from(selectedIds));
            exitEditMode();
          },
        },
      ],
    );
  }

  // ── Build unified drag list (when groups exist) ──
  // Always include ungrouped-header so items can be dragged back out of groups

  const dragItems = useMemo<ListItem[]>(() => {
    if (!hasGroups) return [];
    const items: ListItem[] = [];

    for (const group of sortedGroups) {
      const groupActive = activeTodos
        .filter((t) => t.groupId === group.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const groupCompleted = todos.filter((t) => t.groupId === group.id && !!t.completedAt);
      const allDone = groupActive.length === 0 && groupCompleted.length > 0;
      const collapsed = group.collapsed || allDone;
      const visibleCount = collapsed ? 0 : groupActive.length;
      items.push({
        type: 'group-header',
        key: `gh-${group.id}`,
        group: allDone ? { ...group, collapsed: true } : group,
        completedCount: groupCompleted.length,
        totalCount: groupActive.length + groupCompleted.length,
        hasVisibleItems: visibleCount > 0,
      });
      if (!collapsed) {
        if (groupActive.length === 0) {
          items.push({ type: 'group-empty', key: `ge-${group.id}`, groupId: group.id });
        } else {
          const sorted = sortTodosBySection(groupActive);
          for (let i = 0; i < sorted.length; i++) {
            const pos: GroupPosition =
              sorted.length === 1 ? 'only' : i === 0 ? 'first' : i === sorted.length - 1 ? 'last' : 'middle';
            const curSection = sorted[i].section ?? null;
            const prevSection = i > 0 ? (sorted[i - 1].section ?? null) : undefined;
            const showLabel = curSection !== null && curSection !== prevSection;
            items.push({ type: 'todo', key: sorted[i].id, todo: sorted[i], groupPosition: pos, sectionLabel: showLabel ? curSection : null });
          }
        }
      }
    }

    items.push({ type: 'ungrouped-header', key: 'ungrouped-header' });
    const ungroupedSorted = sortTodosBySection([...ungroupedActive].sort((a, b) => {
      if (a.priority !== b.priority) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return (a.order ?? 0) - (b.order ?? 0);
    }));
    for (let i = 0; i < ungroupedSorted.length; i++) {
      const todo = ungroupedSorted[i];
      const curSection = todo.section ?? null;
      const prevSection = i > 0 ? (ungroupedSorted[i - 1].section ?? null) : undefined;
      const showLabel = curSection !== null && curSection !== prevSection;
      items.push({ type: 'todo', key: todo.id, todo, groupPosition: null, sectionLabel: showLabel ? curSection : null });
    }

    return items;
  }, [hasGroups, sortedGroups, activeTodos, todos, ungroupedActive]);

  const dragItemsRef = useRef(dragItems);
  dragItemsRef.current = dragItems;

  // ── Handlers ──

  function handleAdd({ title, priority, dueDate, pinnedToHome, groupId, section }: TodoCreatePayload) {
    const samePriorityCount = todos.filter((t) => t.priority === priority && !t.completedAt).length;
    const maxPinOrder = todos.reduce(
      (max, t) => (t.pinnedToHome ? Math.max(max, t.pinOrder) : max),
      -1,
    );
    addTodo({
      id: uniqueId(),
      title,
      priority,
      dueDate,
      completedAt: null,
      archivedDate: null,
      createdAt: Date.now(),
      order: samePriorityCount,
      pinnedToHome,
      pinOrder: pinnedToHome ? maxPinOrder + 1 : 0,
      groupId,
      section,
    });
    setAddModalVisible(false);
  }

  function handleEditSave(updates: Pick<Todo, 'title' | 'priority' | 'dueDate' | 'pinnedToHome' | 'groupId' | 'section'>) {
    if (!editTarget) return;
    updateTodo(editTarget.id, updates);
    setEditTarget(null);
  }

  function handleEditDelete() {
    if (!editTarget) return;
    removeTodo(editTarget.id);
    setEditTarget(null);
  }

  function handleAddGroup() {
    if (!isPro && groups.length >= FREE_LIMITS.todoGroups) {
      appAlert('Pro 기능', `Free는 할일 그룹을 ${FREE_LIMITS.todoGroups}개까지 만들 수 있어요.\n설정 > 멤버십에서 업그레이드할 수 있어요.`);
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

  function handleRenameGroup(group: TodoGroup) {
    appPrompt(
      '그룹 이름 변경',
      group.name,
      (text) => updateGroup(group.id, { name: text }),
      '그룹 이름',
    );
  }

  function handleDeleteGroup(group: TodoGroup) {
    appAlert(
      '그룹 삭제',
      `"${group.name}" 그룹을 삭제할까요?\n그룹 안의 할일은 유지됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => removeGroup(group.id) },
      ],
    );
  }

  const handleDragBegin = useCallback((index: number) => {
    dragFromRef.current = index;
    const item = dragItemsRef.current[index];
    dragSourceGroupRef.current = item?.type === 'todo' ? (item.todo.groupId ?? null) : null;
    prevDragTargetRef.current = null;
    setIsDragging(true);
    setDragTargetGroupId(null);
  }, [setIsDragging, setDragTargetGroupId]);

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
  }, [setDragTargetGroupId]);

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
        updates.push({ id: item.todo.id, groupId: currentGroupId, order });
        order++;
      }
    }

    runAfterDragAnimation(() => batchUpdateTodos(updates));
  }

  // ── Arrange mode (group reorder) ──

  type ArrangeItem = { type: 'group-header'; key: string; group: TodoGroup };

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

  // ── Render items ──

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
            할일을 여기로 드래그하세요
          </AppText>
        </View>
      );
    }

    if (item.type === 'ungrouped-header') {
      return <UngroupedHeader count={ungroupedActive.length} />;
    }

    const todo = item.todo;
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
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: 2 }}>
        <AppText variant="caption" tone="tertiary" style={{ fontWeight: '600' }}>{sectionLabel}</AppText>
      </View>
    ) : null;

    if (editMode) {
      const selected = selectedIds.has(todo.id);
      return (
        <>
          {sectionHeader}
          <View style={cardWrapStyle}>
            <Pressable
              onPress={() => toggleSelection(todo.id)}
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
              <AppText variant="body" style={{ flex: 1 }}>{todo.title}</AppText>
            </Pressable>
          </View>
        </>
      );
    }

    const dragElevationStyle = isActive ? {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 },
        android: { elevation: 8 },
      }),
    } : undefined;

    return (
      <ScaleDecorator activeScale={1.04}>
        {sectionHeader}
        <View style={dragElevationStyle}>
          <SwipeActions
            onDelete={() => {
              setUndoTarget(todo);
              removeTodo(todo.id);
            }}
            onComplete={() => completeTodo(todo.id)}
          >
            <View style={cardWrapStyle}>
              <View style={{ paddingHorizontal: spacing.screen }}>
                <TodoItem
                  todo={todo}
                  onToggle={() => completeTodo(todo.id)}
                  onLongPress={drag}
                  onPress={() => setEditTarget(todo)}
                />
              </View>
            </View>
          </SwipeActions>
        </View>
      </ScaleDecorator>
    );
  }

  function renderLegacyTodoItem({ item, drag }: RenderItemParams<Todo>) {
    if (editMode) {
      const selected = selectedIds.has(item.id);
      return (
        <Pressable
          onPress={() => toggleSelection(item.id)}
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
          <AppText variant="body" style={{ flex: 1 }}>{item.title}</AppText>
        </Pressable>
      );
    }

    return (
      <ScaleDecorator activeScale={1.02}>
        <SwipeActions
          onDelete={() => {
            setUndoTarget(item);
            removeTodo(item.id);
          }}
          onComplete={() => completeTodo(item.id)}
        >
          <View>
            <TodoItem
              todo={item}
              onToggle={() => completeTodo(item.id)}
              onLongPress={drag}
              onPress={() => setEditTarget(item)}
            />
            <Divider />
          </View>
        </SwipeActions>
      </ScaleDecorator>
    );
  }

  const modals = (
    <>
      <TodoModal visible={addModalVisible} onSave={handleAdd} onClose={() => setAddModalVisible(false)} />
      <TodoEditModal
        visible={editTarget !== null}
        todo={editTarget}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        onClose={() => setEditTarget(null)}
      />
      <UndoSnackbar
        message="할일이 삭제됐어요"
        visible={undoTarget !== null}
        onUndo={() => undoTarget && addTodo(undoTarget)}
        onDismiss={() => setUndoTarget(null)}
      />
      <Coachmark
        visible={showSwipeHint && filter === 'active' && !editMode && !arrangeMode}
        message="← 삭제 · 완료 → 스와이프 · 길게 눌러 편집"
        onDismiss={() => {
          markHintSeen('swipeActions');
          markHintSeen('longPressEdit');
        }}
      />
    </>
  );

  const hasTodos = activeTodos.length > 0;

  const contentArea = filter === 'completed' ? (
    completedTodos.length === 0 ? (
      <EmptyState message="아직 완료한 일이 없어요" variant="todo" />
    ) : editMode ? (
      <FlatList
        data={completedTodos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: todo }) => {
          const selected = selectedIds.has(todo.id);
          return (
            <Pressable
              onPress={() => toggleSelection(todo.id)}
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
              <AppText
                variant="body"
                tone="tertiary"
                style={{ flex: 1, textDecorationLine: 'line-through' }}
              >
                {todo.title}
              </AppText>
            </Pressable>
          );
        }}
      />
    ) : (
      <FlatList
        data={completedTodos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: todo, index: i }) => (
          <AnimatedListItem itemKey={todo.id} index={i}>
            <SwipeActions
              onDelete={() => { setUndoTarget(todo); removeTodo(todo.id); }}
              onComplete={() => uncompleteTodo(todo.id)}
              completeLabel="되돌리기"
            >
              <View style={{ paddingHorizontal: spacing.screen }}>
                <TodoItem todo={todo} onToggle={() => uncompleteTodo(todo.id)} onPress={() => setEditTarget(todo)} />
                {i < completedTodos.length - 1 && <Divider />}
              </View>
            </SwipeActions>
          </AnimatedListItem>
        )}
      />
    )
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
  ) : !hasTodos && groups.length === 0 ? (
    <EmptyState
      message={`오늘 해낼 일을 적어봐요\n작은 한 걸음이 습관이 돼요`}
      variant="todo"
    />
  ) : hasGroups ? (
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
  ) : (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {ungroupedActive.length > 0 &&
        PRIORITY_SECTIONS.map(({ key, label }) => {
          const items = ungroupedActive
            .filter((t) => t.priority === key)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          if (items.length === 0) return null;
          return (
            <View key={key}>
              <PrioritySectionHeader label={label} priority={key} count={items.length} />
              <View style={{ paddingHorizontal: spacing.screen }}>
                <DraggableFlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  onDragEnd={({ data }) => runAfterDragAnimation(() => reorderTodos(key, data))}
                  renderItem={renderLegacyTodoItem}
                  scrollEnabled={false}
                  activationDistance={4}
                />
              </View>
            </View>
          );
        })}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header
        filter={filter}
        setFilter={setFilter}
        activeTodos={activeTodos}
        completedTodos={completedTodos}
        editMode={editMode}
        arrangeMode={arrangeMode}
        hasGroups={groups.length >= 2}
        onToggleEdit={editMode ? exitEditMode : enterEditMode}
        onToggleArrange={arrangeMode ? exitArrangeMode : enterArrangeMode}
      />

      {contentArea}

      {editMode ? (
        <EditBottomBar
          selectedCount={selectedIds.size}
          totalCount={filter === 'completed' ? completedTodos.length : activeTodos.length}
          onSelectAll={handleSelectAll}
          onDelete={handleBulkDelete}
        />
      ) : !arrangeMode && (
        <SpeedDialFab
          accessibilityLabel="추가 메뉴"
          actions={[
            { label: '할일 추가', icon: 'Plus', onPress: () => setAddModalVisible(true) },
            { label: '그룹 추가', icon: 'FolderPlus', onPress: handleAddGroup },
          ]}
        />
      )}

      {modals}
    </View>
  );
}

// ── Header ──

function Header({
  filter,
  setFilter,
  activeTodos,
  completedTodos,
  editMode,
  arrangeMode,
  hasGroups,
  onToggleEdit,
  onToggleArrange,
}: {
  filter: TabFilter;
  setFilter: (f: TabFilter) => void;
  activeTodos: Todo[];
  completedTodos: Todo[];
  editMode: boolean;
  arrangeMode: boolean;
  hasGroups: boolean;
  onToggleEdit: () => void;
  onToggleArrange: () => void;
}) {
  const c = useThemeColors();
  const isEmpty = activeTodos.length === 0 && completedTodos.length === 0;
  return (
    <>
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
        <AppText variant="title">할일</AppText>
        {(editMode || arrangeMode) ? (
          <Pressable onPress={editMode ? onToggleEdit : onToggleArrange} hitSlop={8} accessibilityRole="button">
            <AppText variant="body" tone="primary" style={{ fontWeight: '600' }}>
              완료
            </AppText>
          </Pressable>
        ) : !isEmpty && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {hasGroups && (
              <Pressable onPress={onToggleArrange} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="그룹 배치">
                <AppIcon name="ArrowUpDown" size={20} color={c.inkTertiary} />
              </Pressable>
            )}
            <Pressable onPress={onToggleEdit} hitSlop={8} style={{ padding: 4 }} accessibilityLabel="편집">
              <AppIcon name="Pencil" size={20} color={c.inkTertiary} />
            </Pressable>
          </View>
        )}
      </View>
      {!editMode && !arrangeMode && (
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.screen, gap: spacing.card, marginBottom: spacing.xs }}>
          {(['active', 'completed'] as TabFilter[]).map((tab) => {
            const isActive = filter === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab)}
                hitSlop={8}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <AppText
                  variant="caption"
                  tone={isActive ? 'primary' : 'tertiary'}
                  style={
                    isActive
                      ? { fontWeight: '700', borderBottomWidth: 1.5, borderBottomColor: c.ink, paddingBottom: 2 }
                      : {}
                  }
                >
                  {tab === 'active' ? `진행 중 ${activeTodos.length}` : `완료 ${completedTodos.length}`}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
      <Divider strong />
    </>
  );
}
