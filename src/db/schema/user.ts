import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey(),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  targetWeightKg: real('target_weight_kg'),
  ageYears: integer('age_years'),
  isMale: integer('is_male', { mode: 'boolean' }),
  updatedAt: integer('updated_at').notNull(),
});

export const weightHistory = sqliteTable('weight_history', {
  id: text('id').primaryKey(),
  weightKg: real('weight_kg').notNull(),
  recordedDate: text('recorded_date').notNull(),
  createdAt: integer('created_at').notNull(),
});
