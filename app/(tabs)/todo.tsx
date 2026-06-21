import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { EmptyState } from '@/components/EmptyState';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { SheetModal, SheetPrimaryButton } from '@/components/SheetModal';
import { SpeedDialFab } from '@/components/SpeedDialFab';
import { SwipeActions } from '@/components/SwipeActions';
import { TodoEditModal } from '@/components/TodoEditModal';
import { TodoItem } from '@/components/TodoItem';
import { type TodoCreatePayload, TodoModal } from '@/components/TodoModal';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { radius, spacing } from '@/constants/spacing';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPriorityColor } from '@/utils/dateFormat';
import { runAfterDragAnimation } from '@/utils/deferredReorder';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { type Todo, type TodoGroup, type TodoPriority, useTodoStore } from '@/stores/useTodoStore';

type TabFilter = 'active' | 'completed';

const TAB_INDEX = 2 as const;

const PRIORITY_SECTIONS: { key: TodoPriority; label: string }[] = [
  { key: 'high', label: '높음' },
  { key: 'mid', label: '보통' },
  { key: 'low', label: '낮음' },
];

const PRIORITY_ORDER: Record<TodoPriority, number> = { high: 0, mid: 1, low: 2 };

// ── Unified drag list types ──

type GroupPosition = 'first' | 'middle' | 'last' | 'only';

type ListItem =
  | { type: 'group-header'; key: string; group: TodoGroup; completedCount: number; totalCount: number; hasVisibleItems: boolean }
  | { type: 'todo'; key: string; todo: Todo; groupPosition: GroupPosition | null }
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

function GroupHeader({
  group,
  completedCount,
  totalCount,
  hasVisibleItems,
  showDelete,
  onToggleCollapse,
  onRename,
  onDelete,
}: {
  group: TodoGroup;
  completedCount: number;
  totalCount: number;
  hasVisibleItems: boolean;
  showDelete: boolean;
  onToggleCollapse: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const c = useThemeColors();
  const rotation = useSharedValue(group.collapsed ? -90 : 0);
  const allDone = totalCount > 0 && completedCount === totalCount;
  const openBottom = hasVisibleItems && !group.collapsed;

  useEffect(() => {
    rotation.value = withTiming(group.collapsed ? -90 : 0, { duration: 200 });
  }, [group.collapsed, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const borderColor = allDone ? `${c.primary}30` : c.borderNeutral;

  return (
    <Pressable
      onPress={onToggleCollapse}
      onLongPress={onRename}
      accessibilityRole="button"
      accessibilityLabel={`${group.name} 그룹, ${completedCount}/${totalCount} 완료`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.screen,
        marginHorizontal: spacing.screen,
        marginTop: spacing.sm,
        borderTopLeftRadius: radius.md,
        borderTopRightRadius: radius.md,
        borderBottomLeftRadius: openBottom ? 0 : radius.md,
        borderBottomRightRadius: openBottom ? 0 : radius.md,
        backgroundColor: c.surfaceSubtle,
        borderWidth: 1,
        borderBottomWidth: openBottom ? 0 : 1,
        borderColor,
      }}
    >
      <Animated.View style={chevronStyle}>
        <AppIcon name="ChevronDown" size={14} color={allDone ? c.primary : c.inkTertiary} />
      </Animated.View>
      <AppText
        variant="body"
        style={{
          fontWeight: '600',
          flex: 1,
          marginLeft: spacing.sm,
          color: allDone ? c.primary : c.ink,
        }}
      >
        {group.name}
      </AppText>
      {allDone ? (
        <AppText variant="caption" style={{ color: c.primary, fontWeight: '700' }}>✓</AppText>
      ) : (
        <AppText variant="caption" tone="disabled">
          {completedCount}/{totalCount}
        </AppText>
      )}
      {showDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${group.name} 그룹 삭제`}
          style={{ marginLeft: spacing.sm }}
        >
          <AppIcon name="Trash2" size={14} color={c.danger} />
        </Pressable>
      )}
    </Pressable>
  );
}

function UngroupedHeader({ count }: { count: number }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.screen,
        marginHorizontal: spacing.screen,
        marginTop: spacing.md,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: c.inkDisabled,
          marginRight: spacing.sm,
        }}
      />
      <AppText variant="caption" tone="disabled" style={{ flex: 1 }}>
        미분류
      </AppText>
      {count > 0 && (
        <AppText variant="caption" tone="disabled">{count}</AppText>
      )}
    </View>
  );
}

function EditBottomBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDelete,
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDelete: () => void;
}) {
  const c = useThemeColors();
  const allSelected = selectedCount === totalCount && totalCount > 0;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screen,
        paddingVertical: spacing.md,
        paddingBottom: spacing.section,
        backgroundColor: c.surfaceSubtle,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      <Pressable
        onPress={onSelectAll}
        hitSlop={8}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
      >
        <AppIcon name={allSelected ? 'CheckSquare' : 'Square'} size={18} color={c.ink} />
        <AppText variant="body">{allSelected ? '선택 해제' : '전체 선택'}</AppText>
      </Pressable>

      <AppText variant="caption" tone="tertiary">{selectedCount}개 선택됨</AppText>

      <Pressable
        onPress={onDelete}
        disabled={selectedCount === 0}
        hitSlop={8}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          opacity: selectedCount === 0 ? 0.4 : 1,
        }}
      >
        <AppIcon name="Trash2" size={16} color={c.danger} />
        <AppText variant="body" style={{ color: c.danger }}>삭제</AppText>
      </Pressable>
    </View>
  );
}

// ── Main ──

export default function TodoScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const {
    todos,
    groups,
    addTodo,
    updateTodo,
    completeTodo,
    uncompleteTodo,
    removeTodo,
    removeTodos,
    reorderTodos,
    addGroup,
    updateGroup,
    removeGroup,
    toggleGroupCollapsed,
    batchUpdateTodos,
  } = useTodoStore();
  const { seenHints, markHintSeen } = useSettingsStore();

  const [filter, setFilter] = useState<TabFilter>('active');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  const [undoTarget, setUndoTarget] = useState<Todo | null>(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeTodos = todos.filter((t) => !t.completedAt);
  const completedTodos = todos.filter((t) => !!t.completedAt);
  const showSwipeHint = !seenHints.swipeActions && todos.length > 0;

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
  const ungroupedActive = activeTodos.filter((t) => !t.groupId);
  const hasGroups = groups.length > 0;

  function enterEditMode() {
    setEditMode(true);
    setSelectedIds(new Set());
  }

  function exitEditMode() {
    setEditMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleTodoIds = useMemo(() => {
    const list = filter === 'active' ? activeTodos : completedTodos;
    return list.map((t) => t.id);
  }, [filter, activeTodos, completedTodos]);

  function handleSelectAll() {
    if (selectedIds.size === visibleTodoIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleTodoIds));
    }
  }

  function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert(
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
      const visibleCount = group.collapsed ? 0 : groupActive.length;
      items.push({
        type: 'group-header',
        key: `gh-${group.id}`,
        group,
        completedCount: groupCompleted.length,
        totalCount: groupActive.length + groupCompleted.length,
        hasVisibleItems: visibleCount > 0,
      });
      if (!group.collapsed) {
        for (let i = 0; i < groupActive.length; i++) {
          const pos: GroupPosition =
            groupActive.length === 1 ? 'only' : i === 0 ? 'first' : i === groupActive.length - 1 ? 'last' : 'middle';
          items.push({ type: 'todo', key: groupActive[i].id, todo: groupActive[i], groupPosition: pos });
        }
      }
    }

    items.push({ type: 'ungrouped-header', key: 'ungrouped-header' });
    const sorted = [...ungroupedActive].sort((a, b) => {
      if (a.priority !== b.priority) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return (a.order ?? 0) - (b.order ?? 0);
    });
    for (const todo of sorted) {
      items.push({ type: 'todo', key: todo.id, todo, groupPosition: null });
    }

    return items;
  }, [hasGroups, sortedGroups, activeTodos, todos, ungroupedActive]);

  // ── Handlers ──

  function handleAdd({ title, priority, dueDate, pinnedToHome, groupId }: TodoCreatePayload) {
    const samePriorityCount = todos.filter((t) => t.priority === priority && !t.completedAt).length;
    const maxPinOrder = todos.reduce(
      (max, t) => (t.pinnedToHome ? Math.max(max, t.pinOrder) : max),
      -1,
    );
    addTodo({
      id: String(Date.now()),
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
    });
    setAddModalVisible(false);
  }

  function handleEditSave(updates: Pick<Todo, 'title' | 'priority' | 'dueDate' | 'pinnedToHome' | 'groupId'>) {
    if (!editTarget) return;
    updateTodo(editTarget.id, updates);
    setEditTarget(null);
  }

  function handleEditDelete() {
    if (!editTarget) return;
    removeTodo(editTarget.id);
    setEditTarget(null);
  }

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

  function handleRenameGroup(group: TodoGroup) {
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

  function handleDeleteGroup(group: TodoGroup) {
    Alert.alert(
      '그룹 삭제',
      `"${group.name}" 그룹을 삭제할까요?\n그룹 안의 할일은 유지됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => removeGroup(group.id) },
      ],
    );
  }

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
        updates.push({ id: item.todo.id, groupId: currentGroupId, order });
        order++;
      }
    }

    runAfterDragAnimation(() => batchUpdateTodos(updates));
  }

  // ── Render items ──

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
      return <UngroupedHeader count={ungroupedActive.length} />;
    }

    const todo = item.todo;
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
      const selected = selectedIds.has(todo.id);
      return (
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
      );
    }

    return (
      <ScaleDecorator activeScale={1.02}>
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
            {(gp !== 'last' && gp !== 'only') && <Divider />}
          </View>
        </SwipeActions>
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
        visible={showSwipeHint && filter === 'active' && !editMode}
        message="← 삭제 · 완료 → 스와이프 · 길게 눌러 편집"
        onDismiss={() => {
          markHintSeen('swipeActions');
          markHintSeen('longPressEdit');
        }}
      />
    </>
  );

  // ── Completed tab ──

  if (filter === 'completed') {
    const showFab = completedTodos.length > 0;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
        <Header
          filter={filter}
          setFilter={setFilter}
          activeTodos={activeTodos}
          completedTodos={completedTodos}
          editMode={editMode}
          onToggleEdit={editMode ? exitEditMode : enterEditMode}
        />
        {completedTodos.length === 0 ? (
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
        )}
        {editMode ? (
          <EditBottomBar
            selectedCount={selectedIds.size}
            totalCount={completedTodos.length}
            onSelectAll={handleSelectAll}
            onDelete={handleBulkDelete}
          />
        ) : (
          showFab && <FloatingAddButton onPress={() => setAddModalVisible(true)} accessibilityLabel="할일 추가" />
        )}
        {modals}
      </SafeAreaView>
    );
  }

  // ── Active tab ──

  const hasTodos = activeTodos.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <Header
        filter={filter}
        setFilter={setFilter}
        activeTodos={activeTodos}
        completedTodos={completedTodos}
        editMode={editMode}
        onToggleEdit={editMode ? exitEditMode : enterEditMode}
      />

      {!hasTodos && groups.length === 0 ? (
        <EmptyState
          message={`오늘 해낼 일을 적어봐요\n작은 한 걸음이 습관이 돼요`}
          actionLabel="할 일 추가하기"
          onAction={() => setAddModalVisible(true)}
          variant="todo"
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
      ) : (
        /* ── Legacy priority-sectioned layout (no groups) ── */
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
      )}

      {editMode ? (
        <EditBottomBar
          selectedCount={selectedIds.size}
          totalCount={activeTodos.length}
          onSelectAll={handleSelectAll}
          onDelete={handleBulkDelete}
        />
      ) : (
        (hasTodos || groups.length > 0) && (
          <SpeedDialFab
            accessibilityLabel="추가 메뉴"
            actions={[
              { label: '할일 추가', icon: 'Plus', onPress: () => setAddModalVisible(true) },
              { label: '그룹 추가', icon: 'FolderPlus', onPress: () => { setNewGroupName(''); setGroupModalVisible(true); } },
            ]}
          />
        )
      )}

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

      {modals}
    </SafeAreaView>
  );
}

// ── Header ──

function Header({
  filter,
  setFilter,
  activeTodos,
  completedTodos,
  editMode,
  onToggleEdit,
}: {
  filter: TabFilter;
  setFilter: (f: TabFilter) => void;
  activeTodos: Todo[];
  completedTodos: Todo[];
  editMode: boolean;
  onToggleEdit: () => void;
}) {
  const c = useThemeColors();
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
        <Pressable onPress={onToggleEdit} hitSlop={8} accessibilityRole="button">
          <AppText variant="body" tone={editMode ? 'primary' : 'tertiary'} style={{ fontWeight: '600' }}>
            {editMode ? '완료' : '편집'}
          </AppText>
        </Pressable>
      </View>
      {!editMode && (
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
      <Divider />
    </>
  );
}
