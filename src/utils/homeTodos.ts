import type { Todo } from '@/stores/useTodoStore';
import { formatDueDate } from '@/utils/dateFormat';

export const HOME_TODO_MAX = 3;

const PRIORITY_ORDER = { high: 0, mid: 1, low: 2 } as const;

export function todoSortScore(todo: Pick<Todo, 'dueDate' | 'priority' | 'order'>) {
  if (!todo.dueDate) return 1000 + PRIORITY_ORDER[todo.priority] * 10 + todo.order;
  const { urgency } = formatDueDate(todo.dueDate);
  const urgencyScore = urgency === 'overdue' ? 0 : urgency === 'today' ? 100 : urgency === 'soon' ? 200 : 300;
  return urgencyScore + PRIORITY_ORDER[todo.priority] * 10 + todo.order;
}

/** 홈 할일: 고정 항목 우선(최대 3) → 남는 슬롯은 자동 정렬로 채움 */
export function selectHomeTodos(todos: Todo[]): Todo[] {
  const active = todos.filter((t) => !t.completedAt);

  const pinned = active
    .filter((t) => !!t.pinnedToHome)
    .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
    .slice(0, HOME_TODO_MAX);

  const pinnedIds = new Set(pinned.map((t) => t.id));
  const remaining = HOME_TODO_MAX - pinned.length;

  const auto = active
    .filter((t) => !pinnedIds.has(t.id))
    .sort((a, b) => todoSortScore(a) - todoSortScore(b))
    .slice(0, Math.max(remaining, 0));

  return [...pinned, ...auto];
}
