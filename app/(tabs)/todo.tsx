import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { TodoItem } from '@/components/TodoItem';
import { TodoModal } from '@/components/TodoModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTodoStore } from '@/stores/useTodoStore';

type TabFilter = 'active' | 'completed';

export default function TodoScreen() {
  const c = useThemeColors();
  const { todos, addTodo, completeTodo, uncompleteTodo, removeTodo } = useTodoStore();
  const [filter, setFilter] = useState<TabFilter>('active');
  const [modalVisible, setModalVisible] = useState(false);

  const activeTodos = todos.filter((t) => !t.completedAt);
  const completedTodos = todos.filter((t) => !!t.completedAt);
  const displayTodos = filter === 'active' ? activeTodos : completedTodos;

  function handleAdd(title: string) {
    addTodo({
      id: String(Date.now()),
      title,
      priority: 'mid',
      dueDate: null,
      completedAt: null,
      createdAt: Date.now(),
    });
    setModalVisible(false);
  }

  function handleLongPress(id: string, isCompleted: boolean) {
    Alert.alert('할 일 관리', undefined, [
      isCompleted
        ? { text: '되돌리기', onPress: () => uncompleteTodo(id) }
        : { text: '완료 표시', onPress: () => completeTodo(id) },
      { text: '삭제', style: 'destructive', onPress: () => removeTodo(id) },
      { text: '취소', style: 'cancel' },
    ]);
  }

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
        <AppText variant="title">투두</AppText>
        <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
          <AppIcon name="Plus" size={22} />
        </Pressable>
      </View>

      {/* 탭 필터 */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          gap: 16,
          marginBottom: 4,
        }}
      >
        {(['active', 'completed'] as TabFilter[]).map((tab) => (
          <Pressable key={tab} onPress={() => setFilter(tab)} hitSlop={4}>
            <AppText
              variant="caption"
              tone={filter === tab ? 'primary' : 'tertiary'}
              style={filter === tab ? { fontWeight: '700', borderBottomWidth: 1.5, borderBottomColor: c.ink, paddingBottom: 2 } : {}}
            >
              {tab === 'active' ? `진행 중 ${activeTodos.length}` : `완료됨 ${completedTodos.length}`}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Divider />

      {/* 리스트 */}
      {displayTodos.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {filter === 'active' ? (
            <>
              <AppText variant="body" tone="tertiary">
                오늘 할 일을 추가해보세요
              </AppText>
              <Pressable onPress={() => setModalVisible(true)}>
                <AppText variant="caption" tone="secondary">
                  할 일 추가하기
                </AppText>
              </Pressable>
            </>
          ) : (
            <AppText variant="body" tone="tertiary">
              완료된 항목이 없어요
            </AppText>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {displayTodos.map((todo, i) => (
            <View key={todo.id}>
              <TodoItem
                todo={todo}
                onToggle={() =>
                  todo.completedAt ? uncompleteTodo(todo.id) : completeTodo(todo.id)
                }
                onLongPress={() => handleLongPress(todo.id, !!todo.completedAt)}
              />
              {i < displayTodos.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      )}

      <TodoModal
        visible={modalVisible}
        onSave={handleAdd}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
