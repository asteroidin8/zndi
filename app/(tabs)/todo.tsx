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
import { SwipeToDelete } from '@/components/SwipeToDelete';
import { TodoEditModal } from '@/components/TodoEditModal';
import { TodoItem } from '@/components/TodoItem';
import { type TodoCreatePayload, TodoModal } from '@/components/TodoModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { type Todo, type TodoPriority, useTodoStore } from '@/stores/useTodoStore';

type TabFilter = 'active' | 'completed';

const PRIORITY_SECTIONS: { key: TodoPriority; label: string }[] = [
  { key: 'high', label: '??' },
  { key: 'mid', label: '??' },
  { key: 'low', label: '??' },
];

function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const colors: Record<TodoPriority, string> = {
    high: '#EF4444',
    mid: '#F59E0B',
    low: '#6B7280',
  };
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors[priority],
        marginRight: 6,
      }}
    />
  );
}

function SectionHeader({ label, priority, count }: { label: string; priority: TodoPriority; count: number }) {
  const c = useThemeColors();
  const colors: Record<TodoPriority, string> = {
    high: '#EF4444',
    mid: '#F59E0B',
    low: '#6B7280',
  };
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
      <AppText variant="caption" style={{ color: colors[priority], fontWeight: '700', flex: 1 }}>
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
  const { todos, addTodo, updateTodo, completeTodo, uncompleteTodo, removeTodo, reorderTodos } =
    useTodoStore();
  const [filter, setFilter] = useState<TabFilter>('active');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);

  // ??? = completedAt ?? (???? ?? ???? ?? ??? ??)
  const activeTodos = todos.filter((t) => !t.completedAt);
  // ??? = completedAt ?? (????? ?? ??? ?? ??)
  const completedTodos = todos.filter((t) => !!t.completedAt);

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
    return function ({ item, drag, isActive }: RenderItemParams<Todo>) {
      return (
        <ScaleDecorator>
          <SwipeToDelete onDelete={() => removeTodo(item.id)}>
            <View style={{ opacity: isActive ? 0.85 : 1 }}>
              <TodoItem
                todo={item}
                onToggle={() =>
                  item.completedAt ? uncompleteTodo(item.id) : completeTodo(item.id)
                }
                onLongPress={drag}
                onPress={() => setEditTarget(item)}
              />
              <Divider />
            </View>
          </SwipeToDelete>
        </ScaleDecorator>
      );
    };
  }

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
          <EmptyState message="??? ??? ???" />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {completedTodos.map((todo, i) => (
              <SwipeToDelete key={todo.id} onDelete={() => removeTodo(todo.id)}>
                <View style={{ paddingHorizontal: 20 }}>
                  <TodoItem
                    todo={todo}
                    onToggle={() => uncompleteTodo(todo.id)}
                    onPress={() => setEditTarget(todo)}
                  />
                  {i < completedTodos.length - 1 && <Divider />}
                </View>
              </SwipeToDelete>
            ))}
          </ScrollView>
        )}
        <TodoEditModal
          visible={editTarget !== null}
          todo={editTarget}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          onClose={() => setEditTarget(null)}
        />
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
          message="?? ? ?? ??????"
          actionLabel="? ? ????"
          onAction={() => setAddModalVisible(true)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
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
                    activationDistance={8}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <TodoModal
        visible={addModalVisible}
        onSave={handleAdd}
        onClose={() => setAddModalVisible(false)}
      />
      <TodoEditModal
        visible={editTarget !== null}
        todo={editTarget}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        onClose={() => setEditTarget(null)}
      />
    </SafeAreaView>
  );
}

// ?? ?? ????????????????????????????????????????????????????
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
        <AppText variant="title">??</AppText>
        <Pressable onPress={onAdd} hitSlop={8}>
          <AppIcon name="Plus" size={22} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginBottom: 4 }}>
        {(['active', 'completed'] as TabFilter[]).map((tab) => {
          const isActive = filter === tab;
          return (
            <Pressable key={tab} onPress={() => setFilter(tab)} hitSlop={4}>
              <AppText
                variant="caption"
                tone={isActive ? 'primary' : 'tertiary'}
                style={
                  isActive
                    ? { fontWeight: '700', borderBottomWidth: 1.5, borderBottomColor: c.ink, paddingBottom: 2 }
                    : {}
                }
              >
                {tab === 'active' ? `?? ? ${activeTodos.length}` : `??? ${completedTodos.length}`}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <Divider />
    </>
  );
}

// ?? ? ?? ?????????????????????????????????????????????????
function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <AppText variant="body" tone="tertiary">
        {message}
      </AppText>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <AppText variant="caption" tone="secondary">
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
