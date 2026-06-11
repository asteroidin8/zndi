import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm';

import { db } from '../client';
import { todos } from '../schema/todo';

export type InsertTodo = typeof todos.$inferInsert;

export async function getAllActiveTodos() {
  return db.select().from(todos).where(isNull(todos.completedAt));
}

export async function getAllCompletedTodos() {
  return db
    .select()
    .from(todos)
    .where(isNotNull(todos.completedAt));
}

export async function insertTodo(todo: InsertTodo) {
  return db.insert(todos).values(todo);
}

export async function completeTodo(id: string) {
  return db
    .update(todos)
    .set({ completedAt: Date.now() })
    .where(eq(todos.id, id));
}

export async function uncompleteTodo(id: string) {
  return db
    .update(todos)
    .set({ completedAt: null })
    .where(eq(todos.id, id));
}

export async function deleteTodo(id: string) {
  return db.delete(todos).where(eq(todos.id, id));
}

// 자정 아카이빙: 전날 이전에 완료된 항목을 별도 보관 (현재는 completedAt 날짜로 구분)
export async function getCompletedBeforeDate(dateMs: number) {
  return db
    .select()
    .from(todos)
    .where(and(lt(todos.completedAt!, dateMs)));
}
