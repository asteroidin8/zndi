import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Coachmark } from '@/components/Coachmark';
import { Divider } from '@/components/Divider';
import { DragItemWrapper } from '@/components/DragItemWrapper';
import { EmptyIllustration } from '@/components/EmptyIllustration';
import { SwipeActions } from '@/components/SwipeActions';
import { TodoEditModal } from '@/components/TodoEditModal';
import { TodoItem } from '@/components/TodoItem';
import { type TodoCreatePayload, TodoModal } from '@/components/TodoModal';
import { UndoSnackbar } from '@/components/UndoSnackbar';
import { useTabScrollToTop } from '@/contexts/TabNavigationContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPriorityColor } from '@/utils/dateFormat';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { type Todo, type TodoPriority, useTodoStore } from '@/stores/useTodoStore';

type TabFilter = 'active' | 'completed';

const TAB_INDEX = 3 as const;

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

function SectionHeader({ label, priority, count }: { label: string; priority: TodoPriority; count: number }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
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

export default function TodoScreen() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(TAB_INDEX, scrollRef);

  const { todos, addTodo, updateTodo, completeTodo, uncompleteTodo, removeTodo, reorderTodos } =
    useTodoStore();
  const { seenHints, markHintSeen } = useSettingsStore();

  const [filter, setFilter] = useState<TabFilter>('active');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  const [undoTarget, setUndoTarget] = useState<Todo | null>(null);

  const activeTodos = todos.filter((t) => !t.completedAt);
  const completedTodos = todos.filter((t) => !!t.completedAt);
  const showSwipeHint = !seenHints.swipeActions && todos.length > 0;

  function handleAdd({ title, priority, dueDate }: TodoCreatePayload) {
    const samePriorityCount = todos.filter((t) => t.priority === priority && !t.completedAt).length;
    addTodo({
      id: String(Date.now()),
      title,
      priority,
      dueDate,
      completedAt: null,
      archivedDate: null,
      createdAt: Date.now(),
      order: samePriorityCount,
    });
    setAddModalVisible(false);
  }

  function handleEditSave(updates: Pick<Todo, 'title' | 'priority' | 'dueDate'>) {
    if (!editTarget) return;
    updateTodo(editTarget.id, updates);
    setEditTarget(null);
  }

  function handleEditDelete() {
    if (!editTarget) return;
    removeTodo(editTarget.id);
    setEditTarget(null);
  }

  function renderDraggableItem(priority: TodoPriority) {
    return function ({ item, drag, isActive, getIndex }: RenderItemParams<Todo>) {
      const idx = getIndex?.() ?? 0;
      return (
        <AnimatedListItem itemKey={item.id} index={idx} animateLayout={!isActive}>
          <DragItemWrapper isActive={isActive}>
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
          </DragItemWrapper>
        </AnimatedListItem>
      );
    };
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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
        <Header
          filter={filter}
          setFilter={setFilter}
          activeTodos={activeTodos}
          completedTodos={completedTodos}
          onAdd={() => setAddModalVisible(true)}
        />
        {completedTodos.length === 0 ? (
          <EmptyState message="아직 완료한 일이 없어요" variant="todo" />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {completedTodos.map((todo, i) => (
              <AnimatedListItem key={todo.id} itemKey={todo.id} index={i}>
                <SwipeActions
                  onDelete={() => {
                    setUndoTarget(todo);
                    removeTodo(todo.id);
                  }}
                  onComplete={() => uncompleteTodo(todo.id)}
                  completeLabel="되돌리기"
                >
                  <View style={{ paddingHorizontal: 20 }}>
                    <TodoItem
                      todo={todo}
                      onToggle={() => uncompleteTodo(todo.id)}
                      onPress={() => setEditTarget(todo)}
                    />
                    {i < completedTodos.length - 1 && <Divider />}
                  </View>
                </SwipeActions>
              </AnimatedListItem>
            ))}
          </ScrollView>
        )}
        {modals}
      </SafeAreaView>
    );
  }

  const hasTodos = activeTodos.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <Header
        filter={filter}
        setFilter={setFilter}
        activeTodos={activeTodos}
        completedTodos={completedTodos}
        onAdd={() => setAddModalVisible(true)}
      />

      {!hasTodos ? (
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
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {PRIORITY_SECTIONS.map(({ key, label }) => {
            const items = activeTodos
              .filter((t) => t.priority === key)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            if (items.length === 0) return null;
            return (
              <View key={key}>
                <SectionHeader label={label} priority={key} count={items.length} />
                <View style={{ paddingHorizontal: 20 }}>
                  <DraggableFlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data }) => reorderTodos(key, data)}
                    renderItem={renderDraggableItem(key)}
                    scrollEnabled={false}
                    activationDistance={4}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  onAdd,
}: {
  filter: TabFilter;
  setFilter: (f: TabFilter) => void;
  activeTodos: Todo[];
  completedTodos: Todo[];
  onAdd: () => void;
}) {
  const c = useThemeColors();
  return (
    <>
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
        <AppText variant="title">할일</AppText>
        <Pressable onPress={onAdd} hitSlop={12} accessibilityRole="button" accessibilityLabel="할일 추가">
          <AppIcon name="Plus" size={22} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginBottom: 4 }}>
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
