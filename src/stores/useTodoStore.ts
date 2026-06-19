import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TodoPriority = 'high' | 'mid' | 'low';

export type TodoGroup = {
  id: string;
  name: string;
  order: number;
  collapsed: boolean;
};

export type Todo = {
  id: string;
  title: string;
  priority: TodoPriority;
  dueDate: string | null;
  completedAt: number | null;
  archivedDate: string | null;
  createdAt: number;
  order: number;
  pinnedToHome: boolean;
  pinOrder: number;
  groupId: string | null;
};

type TodoStore = {
  todos: Todo[];
  groups: TodoGroup[];
  lastArchiveDate: string | null;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  completeTodo: (id: string) => void;
  uncompleteTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  reorderTodos: (priority: TodoPriority, ordered: Todo[]) => void;
  toggleTodoHomePin: (id: string) => void;
  archiveCompletedTodos: (date: string) => void;
  setLastArchiveDate: (date: string) => void;
  addGroup: (group: TodoGroup) => void;
  updateGroup: (id: string, updates: Partial<TodoGroup>) => void;
  removeGroup: (id: string) => void;
  reorderGroups: (ordered: TodoGroup[]) => void;
  toggleGroupCollapsed: (id: string) => void;
  moveTodoToGroup: (todoId: string, groupId: string | null) => void;
  reorderGroupTodos: (groupId: string, ordered: Todo[]) => void;
};

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      groups: [],
      lastArchiveDate: null,
      addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((t) => {
            if (t.id !== id) return t;

            const next = { ...t, ...updates };

            if ('pinnedToHome' in updates) {
              if (updates.pinnedToHome && !t.pinnedToHome) {
                const maxPinOrder = state.todos.reduce(
                  (max, item) => (item.pinnedToHome ? Math.max(max, item.pinOrder) : max),
                  -1,
                );
                next.pinOrder = maxPinOrder + 1;
              } else if (updates.pinnedToHome === false) {
                next.pinOrder = 0;
              }
            }

            return next;
          }),
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
      toggleTodoHomePin: (id) =>
        set((state) => {
          const target = state.todos.find((t) => t.id === id);
          if (!target) return state;

          if (target.pinnedToHome) {
            return {
              todos: state.todos.map((t) =>
                t.id === id ? { ...t, pinnedToHome: false, pinOrder: 0 } : t,
              ),
            };
          }

          const maxPinOrder = state.todos.reduce(
            (max, t) => (t.pinnedToHome ? Math.max(max, t.pinOrder) : max),
            -1,
          );

          return {
            todos: state.todos.map((t) =>
              t.id === id ? { ...t, pinnedToHome: true, pinOrder: maxPinOrder + 1 } : t,
            ),
          };
        }),
      archiveCompletedTodos: (date) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.completedAt && !t.archivedDate ? { ...t, archivedDate: date } : t,
          ),
          lastArchiveDate: date,
        })),
      setLastArchiveDate: (date) => set({ lastArchiveDate: date }),

      addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      removeGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          todos: state.todos.map((t) => (t.groupId === id ? { ...t, groupId: null } : t)),
        })),
      reorderGroups: (ordered) =>
        set({ groups: ordered.map((g, i) => ({ ...g, order: i })) }),
      toggleGroupCollapsed: (id) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, collapsed: !g.collapsed } : g,
          ),
        })),
      moveTodoToGroup: (todoId, groupId) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === todoId ? { ...t, groupId } : t)),
        })),
      reorderGroupTodos: (groupId, ordered) =>
        set((state) => {
          const others = state.todos.filter((t) => t.groupId !== groupId);
          const updated = ordered.map((t, i) => ({ ...t, order: i }));
          return { todos: [...others, ...updated] };
        }),
    }),
    {
      name: 'todo-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
