import { desc, eq } from 'drizzle-orm';

import { db } from '../client';
import { fastingRecords } from '../schema/fasting';

export type InsertFasting = typeof fastingRecords.$inferInsert;

export async function insertFastingRecord(record: InsertFasting) {
  return db.insert(fastingRecords).values(record);
}

export async function updateFastingEnd(
  id: string,
  endedAt: number,
  result: 'completed' | 'abandoned',
) {
  return db
    .update(fastingRecords)
    .set({ endedAt, result })
    .where(eq(fastingRecords.id, id));
}

export async function getAllFastingRecords() {
  return db.select().from(fastingRecords).orderBy(desc(fastingRecords.startedAt));
}
