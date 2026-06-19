import { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { SwipeActions } from '@/components/SwipeActions';
import { TodoEditModal } from '@/components/TodoEditModal';
import { TodoItem } from '@/components/TodoItem';
import { type TodoCreatePayload, TodoModal } from '@/components/TodoModal';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { spacing } from '@/constants/spacing';
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

function GrassBar({ completed, total }: { completed: number; total: number }) {
  const c = useThemeColors();
  if (total === 0) return null;

  const cells = Array.from({ length: total }, (_, i) => i < completed);

  return (
    <View style={{ flexDirection: 'row', gap: 3, marginTop: spacing.xs }}>
      {cells.map((filled, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: filled ? c.primary : c.surfaceMuted,
            ...(filled
              ? {
                  shadowColor: c.neonGlow,
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 1,
                }
              : {}),
          }}
        />
      ))}
    </View>
  );
}

function GroupHeader({
  group,
  completedCount,
  totalCount,
  onToggleCollapse,
  onRename,
  onDelete,
}: {
  group: TodoGroup;
  completedCount: number;
  totalCount: number;
  onToggleCollapse: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onToggleCollapse}
      onLongPress={onRename}
      accessibilityRole="button"
      accessibilityLabel={`${group.name} 그룹, ${completedCount}/${totalCount} 완료`}
      style={{
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.screen,
        backgroundColor: c.surface,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppIcon
          name={group.collapsed ? 'ChevronRight' : 'ChevronDown'}
          size={14}
          color={c.inkTertiary}
        />
        <AppText variant="body" style={{ fontWeight: '600', flex: 1 }}>
          {group.name}
        </AppText>
        <AppText variant="caption" tone="tertiary">
          {completedCount}/{totalCount}
        </AppText>
      </View>
      {!group.collapsed && totalCount > 0 && (
        <View style={{ paddingLeft: 22 }}>
          <GrassBar completed={completedCount} total={totalCount} />
        </View>
      )}
    </Pressable>
  );
}

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
    reorderTodos,
    addGroup,
    updateGroup,
    removeGroup,
    toggleGroupCollapsed,
    reorderGroupTodos,
  } = useTodoStore();
  const { seenHints, markHintSeen } = useSettingsStore();

  const [filter, setFilter] = useState<TabFilter>('active');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  const [undoTarget, setUndoTarget] = useState<Todo | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);

  const activeTodos = todos.filter((t) => !t.completedAt);
  const completedTodos = todos.filter((t) => !!t.completedAt);
  const showSwipeHint = !seenHints.swipeActions && todos.length > 0;

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
  const ungroupedActive = activeTodos.filter((t) => !t.groupId);

  function handleAdd({ title, priority, dueDate, pinnedToHome }: TodoCreatePayload) {
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
      groupId: null,
    });
    setAddModalVisible(false);
  }

  function handleEditSave(updates: Pick<Todo, 'title' | 'priority' | 'dueDate' | 'pinnedToHome'>) {
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
    setShowGroupInput(false);
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

  function renderTodoItem({ item, drag }: RenderItemParams<Todo>) {
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
        visible={showSwipeHint && filter === 'active'}
        message="← 삭제 · 완료 → 스와이프 · 길게 눌러 편집"
        onDismiss={() => {
          markHintSeen('swipeActions');
          markHintSeen('longPressEdit');
        }}
      />
    </>
  );

  if (filter === 'completed') {
    const showFab = completedTodos.length > 0;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
        <Header filter={filter} setFilter={setFilter} activeTodos={activeTodos} completedTodos={completedTodos} />
        {completedTodos.length === 0 ? (
          <EmptyState message="아직 완료한 일이 없어요" variant="todo" />
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
        {showFab && <FloatingAddButton onPress={() => setAddModalVisible(true)} accessibilityLabel="할일 추가" />}
        {modals}
      </SafeAreaView>
    );
  }

  const hasTodos = activeTodos.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <Header filter={filter} setFilter={setFilter} activeTodos={activeTodos} completedTodos={completedTodos} />

      {!hasTodos && groups.length === 0 ? (
        <EmptyState
          message={`오늘 해낼 일을 적어봐요\n작은 한 걸음이 습관이 돼요`}
          actionLabel="할 일 추가하기"
          onAction={() => setAddModalVisible(true)}
          variant="todo"
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* 그룹 섹션 */}
          {sortedGroups.map((group) => {
            const groupTodos = activeTodos
              .filter((t) => t.groupId === group.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const groupCompleted = todos.filter((t) => t.groupId === group.id && !!t.completedAt);

            return (
              <View key={group.id}>
                <GroupHeader
                  group={group}
                  completedCount={groupCompleted.length}
                  totalCount={groupTodos.length + groupCompleted.length}
                  onToggleCollapse={() => toggleGroupCollapsed(group.id)}
                  onRename={() => handleRenameGroup(group)}
                  onDelete={() => handleDeleteGroup(group)}
                />
                {!group.collapsed && groupTodos.length > 0 && (
                  <View style={{ paddingHorizontal: spacing.screen }}>
                    <DraggableFlatList
                      data={groupTodos}
                      keyExtractor={(item) => item.id}
                      onDragEnd={({ data }) =>
                        runAfterDragAnimation(() => reorderGroupTodos(group.id, data))
                      }
                      renderItem={renderTodoItem}
                      scrollEnabled={false}
                      activationDistance={4}
                    />
                  </View>
                )}
                {!group.collapsed && groupTodos.length === 0 && groupCompleted.length === 0 && (
                  <View style={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.sm }}>
                    <AppText variant="caption" tone="disabled">비어 있음</AppText>
                  </View>
                )}
                <Divider />
              </View>
            );
          })}

          {/* 그룹 추가 버튼 */}
          {showGroupInput ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen, paddingVertical: spacing.sm, gap: spacing.sm }}>
              <TextInput
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="그룹 이름"
                placeholderTextColor={c.inkDisabled}
                autoFocus
                onSubmitEditing={handleCreateGroup}
                returnKeyType="done"
                style={{ flex: 1, fontSize: 15, color: c.ink, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: spacing.xs }}
              />
              <Pressable onPress={handleCreateGroup} hitSlop={8}>
                <AppText variant="caption" style={{ color: c.primary, fontWeight: '700' }}>추가</AppText>
              </Pressable>
              <Pressable onPress={() => { setShowGroupInput(false); setNewGroupName(''); }} hitSlop={8}>
                <AppText variant="caption" tone="tertiary">취소</AppText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowGroupInput(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screen, paddingVertical: spacing.sm + 2, gap: spacing.xs }}
            >
              <AppIcon name="FolderPlus" size={14} color={c.inkTertiary} />
              <AppText variant="caption" tone="tertiary">그룹 추가</AppText>
            </Pressable>
          )}

          {/* 그룹 없는 할일 (우선순위별) */}
          {ungroupedActive.length > 0 && (
            <>
              {groups.length > 0 && <View style={{ height: spacing.sm }} />}
              {PRIORITY_SECTIONS.map(({ key, label }) => {
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
                        renderItem={renderTodoItem}
                        scrollEnabled={false}
                        activationDistance={4}
                      />
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {(hasTodos || groups.length > 0) && (
        <FloatingAddButton onPress={() => setAddModalVisible(true)} accessibilityLabel="할일 추가" />
      )}

      {modals}
    </SafeAreaView>
  );
}

function Header({
  filter,
  setFilter,
  activeTodos,
  completedTodos,
}: {
  filter: TabFilter;
  setFilter: (f: TabFilter) => void;
  activeTodos: Todo[];
  completedTodos: Todo[];
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
      </View>
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
      <Divider />
    </>
  );
}

function EmptyState({
  message,
  actionLabel,
  onAction,
  variant = 'todo',
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'todo' | 'routine';
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 }}>
      <EmptyIllustration variant={variant} />
      <AppText variant="body" tone="tertiary" style={{ textAlign: 'center', lineHeight: 22 }}>
        {message}
      </AppText>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <AppText variant="caption" tone="secondary" style={{ textDecorationLine: 'underline' }}>
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
