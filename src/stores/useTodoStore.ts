import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { markDirty } from '@/services/sync/dirtyTracker';
import type { Todo, TodoGroup, TodoPriority } from '@/types';

export type { Todo, TodoGroup, TodoPriority } from '@/types';

function nextPinOrder(todos: Todo[]): number {
  return todos.reduce((max, t) => (t.pinnedToHome ? Math.max(max, t.pinOrder) : max), -1) + 1;
}

import { DELETED_RETENTION_DAYS } from '@/constants/dataRetention';

type TodoStore = {
  todos: Todo[];
  groups: TodoGroup[];
  lastArchiveDate: string | null;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  completeTodo: (id: string) => void;
  uncompleteTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  undoRemoveTodo: (id: string) => void;
  purgeOldDeleted: () => void;
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
  batchUpdateTodos: (updates: { id: string; groupId: string | null; order: number }[]) => void;
  removeTodos: (ids: string[]) => void;
};

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      groups: [],
      lastArchiveDate: null,

      addTodo: (todo) => { markDirty('todos', todo.id); set((s) => ({ todos: [...s.todos, todo] })); },

      updateTodo: (id, updates) => {
        markDirty('todos', id);
        set((s) => ({
          todos: s.todos.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...updates };
            if ('pinnedToHome' in updates) {
              if (updates.pinnedToHome && !t.pinnedToHome) {
                next.pinOrder = nextPinOrder(s.todos);
              } else if (updates.pinnedToHome === false) {
                next.pinOrder = 0;
              }
            }
            return next;
          }),
        }));
      },

      completeTodo: (id) => { markDirty('todos', id); set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, completedAt: Date.now() } : t)) })); },

      uncompleteTodo: (id) => { markDirty('todos', id); set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, completedAt: null } : t)) })); },

      removeTodo: (id) => { markDirty('todos', id); set((s) => ({ todos: s.todos.map((t) => t.id === id ? { ...t, deletedAt: Date.now() } : t) })); },

      undoRemoveTodo: (id) => { markDirty('todos', id); set((s) => ({ todos: s.todos.map((t) => t.id === id ? { ...t, deletedAt: undefined } : t) })); },

      purgeOldDeleted: () => {
        const cutoff = Date.now() - DELETED_RETENTION_DAYS * 86_400_000;
        set((s) => ({
          todos: s.todos.filter(
            (t) => !t.deletedAt || t.deletedAt > cutoff,
          ),
        }));
      },

      reorderTodos: (priority, ordered) => {
        for (const t of ordered) markDirty('todos', t.id);
        set((s) => ({
          todos: [
            ...s.todos.filter((t) => t.priority !== priority),
            ...ordered.map((t, i) => ({ ...t, order: i })),
          ],
        }));
      },

      toggleTodoHomePin: (id) => {
        markDirty('todos', id);
        set((s) => {
          const target = s.todos.find((t) => t.id === id);
          if (!target) return s;
          const pinOrder = target.pinnedToHome ? 0 : nextPinOrder(s.todos);
          return {
            todos: s.todos.map((t) =>
              t.id === id ? { ...t, pinnedToHome: !target.pinnedToHome, pinOrder } : t,
            ),
          };
        });
      },

      archiveCompletedTodos: (date) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.completedAt && !t.archivedDate ? { ...t, archivedDate: date } : t,
          ),
          lastArchiveDate: date,
        })),

      setLastArchiveDate: (date) => set({ lastArchiveDate: date }),

      addGroup: (group) => { markDirty('todo_groups', group.id); set((s) => ({ groups: [...s.groups, group] })); },

      updateGroup: (id, updates) => { markDirty('todo_groups', id); set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)) })); },

      removeGroup: (id) => {
        markDirty('todo_groups', id);
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          todos: s.todos.map((t) => (t.groupId === id ? { ...t, groupId: null } : t)),
        }));
      },

      reorderGroups: (ordered) => {
        for (const g of ordered) markDirty('todo_groups', g.id);
        set({ groups: ordered.map((g, i) => ({ ...g, order: i })) });
      },

      toggleGroupCollapsed: (id) => set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)) })),

      moveTodoToGroup: (todoId, groupId) => { markDirty('todos', todoId); set((s) => ({ todos: s.todos.map((t) => (t.id === todoId ? { ...t, groupId } : t)) })); },

      reorderGroupTodos: (groupId, ordered) => {
        for (const t of ordered) markDirty('todos', t.id);
        set((s) => ({
          todos: [
            ...s.todos.filter((t) => t.groupId !== groupId),
            ...ordered.map((t, i) => ({ ...t, order: i })),
          ],
        }));
      },

      batchUpdateTodos: (updates) => {
        for (const u of updates) markDirty('todos', u.id);
        set((s) => ({
          todos: s.todos.map((t) => {
            const u = updates.find((up) => up.id === t.id);
            return u ? { ...t, groupId: u.groupId, order: u.order } : t;
          }),
        }));
      },

      removeTodos: (ids) => {
        for (const id of ids) markDirty('todos', id);
        set((s) => ({
          todos: s.todos.map((t) =>
            ids.includes(t.id) ? { ...t, deletedAt: Date.now() } : t,
          ),
        }));
      },
    }),
    {
      name: 'todo-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 1) {
          const todos = (state.todos ?? []) as Record<string, unknown>[];
          state.todos = todos.map((t) => ({ ...t, section: t.section ?? null }));
        }
        if (version < 2) {
          // v2: soft delete — no migration needed, deletedAt is optional
        }
        return state as TodoStore;
      },
    },
  ),
);
