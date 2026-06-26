const dirtyIds: Record<string, Set<string>> = {
  routines: new Set(),
  routine_groups: new Set(),
  todos: new Set(),
  todo_groups: new Set(),
  completions: new Set(),
  fasting: new Set(),
  user: new Set(),
  weight: new Set(),
};

export function markDirty(store: string, id: string) {
  if (!dirtyIds[store]) dirtyIds[store] = new Set();
  dirtyIds[store].add(id);
}

export function getDirtyIds(store: string): Set<string> {
  return dirtyIds[store] ?? new Set();
}

export function clearDirty(store: string) {
  if (dirtyIds[store]) dirtyIds[store].clear();
}

export function hasDirtyIds(store: string): boolean {
  return (dirtyIds[store]?.size ?? 0) > 0;
}
