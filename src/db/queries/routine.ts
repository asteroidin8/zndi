import { eq } from 'drizzle-orm';

import { db } from '../client';
import { routineCompletions, routines } from '../schema/routine';

export type InsertRoutine = typeof routines.$inferInsert;

export async function getAllRoutines() {
  return db.select().from(routines);
}

export async function insertRoutine(routine: InsertRoutine) {
  return db.insert(routines).values(routine);
}

export async function updateRoutine(id: string, data: Partial<InsertRoutine>) {
  return db.update(routines).set(data).where(eq(routines.id, id));
}

export async function deleteRoutine(id: string) {
  return db.delete(routines).where(eq(routines.id, id));
}

export async function insertRoutineCompletion(routineId: string, date: string) {
  return db.insert(routineCompletions).values({
    id: String(Date.now()),
    routineId,
    completedDate: date,
    createdAt: Date.now(),
  });
}

export async function getCompletionsByDate(date: string) {
  return db
    .select()
    .from(routineCompletions)
    .where(eq(routineCompletions.completedDate, date));
}
