import { useTodoStore } from '@/stores/useTodoStore';
import type { Todo, TodoGroup } from '@/types';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `todo-${Math.random().toString(36).slice(2, 8)}`,
  text: 'Test todo',
  priority: 'mid',
  completedAt: null,
  createdAt: Date.now(),
  order: 0,
  pinnedToHome: false,
  pinOrder: 0,
  groupId: null,
  dueDate: null,
  archivedDate: null,
  ...overrides,
});

const makeGroup = (overrides: Partial<TodoGroup> = {}): TodoGroup => ({
  id: `group-${Math.random().toString(36).slice(2, 8)}`,
  name: 'Test Group',
  order: 0,
  collapsed: false,
  ...overrides,
});

beforeEach(() => {
  useTodoStore.setState({ todos: [], groups: [], lastArchiveDate: null });
});

describe('useTodoStore', () => {
  describe('addTodo', () => {
    it('adds a todo to the store', () => {
      const todo = makeTodo({ id: 't1', text: 'Buy milk' });
      useTodoStore.getState().addTodo(todo);
      expect(useTodoStore.getState().todos).toHaveLength(1);
      expect(useTodoStore.getState().todos[0].text).toBe('Buy milk');
    });
  });

  describe('completeTodo', () => {
    it('sets completedAt timestamp', () => {
      const todo = makeTodo({ id: 't1' });
      useTodoStore.setState({ todos: [todo] });
      useTodoStore.getState().completeTodo('t1');
      expect(useTodoStore.getState().todos[0].completedAt).toBeTruthy();
    });
  });

  describe('uncompleteTodo', () => {
    it('clears completedAt', () => {
      const todo = makeTodo({ id: 't1', completedAt: Date.now() });
      useTodoStore.setState({ todos: [todo] });
      useTodoStore.getState().uncompleteTodo('t1');
      expect(useTodoStore.getState().todos[0].completedAt).toBeNull();
    });
  });

  describe('removeTodo', () => {
    it('soft-deletes the todo with deletedAt', () => {
      useTodoStore.setState({ todos: [makeTodo({ id: 't1' }), makeTodo({ id: 't2' })] });
      useTodoStore.getState().removeTodo('t1');
      const todos = useTodoStore.getState().todos;
      expect(todos).toHaveLength(2);
      expect(todos.find((t) => t.id === 't1')?.deletedAt).toBeTruthy();
      expect(todos.find((t) => t.id === 't2')?.deletedAt).toBeUndefined();
    });
  });

  describe('updateTodo', () => {
    it('updates partial fields', () => {
      useTodoStore.setState({ todos: [makeTodo({ id: 't1', text: 'Old' })] });
      useTodoStore.getState().updateTodo('t1', { text: 'New' });
      expect(useTodoStore.getState().todos[0].text).toBe('New');
    });
  });

  describe('groups', () => {
    it('adds a group', () => {
      const group = makeGroup({ id: 'g1', name: 'Work' });
      useTodoStore.getState().addGroup(group);
      expect(useTodoStore.getState().groups).toHaveLength(1);
    });

    it('removes a group and unlinks todos', () => {
      const group = makeGroup({ id: 'g1' });
      const todo = makeTodo({ id: 't1', groupId: 'g1' });
      useTodoStore.setState({ todos: [todo], groups: [group] });
      useTodoStore.getState().removeGroup('g1');
      expect(useTodoStore.getState().groups).toHaveLength(0);
      expect(useTodoStore.getState().todos[0].groupId).toBeNull();
    });

    it('toggles group collapsed state', () => {
      const group = makeGroup({ id: 'g1', collapsed: false });
      useTodoStore.setState({ groups: [group] });
      useTodoStore.getState().toggleGroupCollapsed('g1');
      expect(useTodoStore.getState().groups[0].collapsed).toBe(true);
    });

    it('moves todo to a group', () => {
      const todo = makeTodo({ id: 't1', groupId: null });
      useTodoStore.setState({ todos: [todo] });
      useTodoStore.getState().moveTodoToGroup('t1', 'g1');
      expect(useTodoStore.getState().todos[0].groupId).toBe('g1');
    });
  });

  describe('archiveCompletedTodos', () => {
    it('archives completed todos with the given date', () => {
      useTodoStore.setState({
        todos: [
          makeTodo({ id: 't1', completedAt: Date.now() }),
          makeTodo({ id: 't2', completedAt: null }),
        ],
      });
      useTodoStore.getState().archiveCompletedTodos('2026-06-20');
      const todos = useTodoStore.getState().todos;
      expect(todos.find((t) => t.id === 't1')?.archivedDate).toBe('2026-06-20');
      expect(todos.find((t) => t.id === 't2')?.archivedDate).toBeNull();
      expect(useTodoStore.getState().lastArchiveDate).toBe('2026-06-20');
    });
  });
});
