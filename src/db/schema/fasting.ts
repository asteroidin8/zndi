import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const fastingRecords = sqliteTable('fasting_records', {
  id: text('id').primaryKey(),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  goalHours: real('goal_hours').notNull(),
  result: text('result', { enum: ['completed', 'abandoned'] }),
  weightKgBefore: real('weight_kg_before'),
  weightKgAfter: real('weight_kg_after'),
  createdAt: integer('created_at').notNull(),
});
