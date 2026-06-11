import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TodoPriority = 'high' | 'mid' | 'low';

export type Todo = {
  id: string;
  title: string;
  priority: TodoPriority;
  dueDate: string | null; // 'YYYY-MM-DD' 형식
  completedAt: number | null; // Unix timestamp (ms)
  archivedDate: string | null; // 아카이브된 날짜 'YYYY-MM-DD'
  createdAt: number;
  order: number;
};

type TodoStore = {
  todos: Todo[];
  lastArchiveDate: string | null;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  completeTodo: (id: string) => void;
  uncompleteTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  reorderTodos: (priority: TodoPriority, ordered: Todo[]) => void;
  archiveCompletedTodos: (date: string) => void;
  setLastArchiveDate: (date: string) => void;
};

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      lastArchiveDate: null,
      addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      completeTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, completedAt: Date.now() } : t,
          ),
        })),
      uncompleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, completedAt: null } : t)),
        })),
      removeTodo: (id) => set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
      reorderTodos: (priority, ordered) =>
        set((state) => {
          const others = state.todos.filter((t) => t.priority !== priority);
          const updated = ordered.map((t, i) => ({ ...t, order: i }));
          return { todos: [...others, ...updated] };
        }),
      // 자정 아카이브: 완료된 항목에 archivedDate 기록, 미완료는 그대로 유지
      archiveCompletedTodos: (date) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.completedAt && !t.archivedDate ? { ...t, archivedDate: date } : t,
          ),
          lastArchiveDate: date,
        })),
      setLastArchiveDate: (date) => set({ lastArchiveDate: date }),
    }),
    {
      name: 'todo-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
