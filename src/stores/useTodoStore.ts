import { create } from 'zustand';

export type TodoPriority = 'high' | 'mid' | 'low';

export type Todo = {
  id: string;
  title: string;
  priority: TodoPriority;
  dueDate: string | null; // 'YYYY-MM-DD' 형식
  completedAt: number | null; // Unix timestamp (ms)
  createdAt: number;
};

type TodoStore = {
  todos: Todo[];
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  completeTodo: (id: string) => void;
  uncompleteTodo: (id: string) => void;
  removeTodo: (id: string) => void;
};

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
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
}));
