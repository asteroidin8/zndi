import { eq } from 'drizzle-orm';

import { db } from '../client';
import { userProfile, weightHistory } from '../schema/user';

export async function getUserProfile() {
  const rows = await db.select().from(userProfile).where(eq(userProfile.id, 1));
  return rows[0] ?? null;
}

export async function upsertUserProfile(
  data: Partial<{
    heightCm: number;
    weightKg: number;
    targetWeightKg: number;
    ageYears: number;
    isMale: boolean;
  }>,
) {
  const existing = await getUserProfile();
  if (existing) {
    return db
      .update(userProfile)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(userProfile.id, 1));
  }
  return db.insert(userProfile).values({ id: 1, ...data, updatedAt: Date.now() });
}

export async function insertWeightHistory(weightKg: number, date: string) {
  return db.insert(weightHistory).values({
    id: String(Date.now()),
    weightKg,
    recordedDate: date,
    createdAt: Date.now(),
  });
}

export async function getWeightHistory() {
  return db.select().from(weightHistory);
}
