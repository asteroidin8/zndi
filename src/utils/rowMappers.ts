import type { Routine, RepeatType, Todo } from '@/types';
import type { Weekday } from '@/stores/useRoutineStore';

export function routineFromRow(row: Record<string, unknown>): Routine {
  return {
    id: String(row.id),
    name: String(row.name),
    repeatType: ((row.repeat_type as string | undefined) ?? 'weekly') as RepeatType,
    repeatDays: row.repeat_days as Weekday[],
    monthDates: (row.month_dates as number[] | undefined) ?? [],
    repeatInterval: (row.repeat_interval as number | undefined) ?? 1,
    section: (row.section as string | null | undefined) ?? null,
    reminderTime: (row.reminder_time as string | null) ?? null,
    createdAt: Number(row.created_at),
    order: Number(row.sort_order),
    groupId: (row.group_id as string | null) ?? null,
    deletedAt: (row.deleted_at as number | undefined) ?? undefined,
  };
}

export function todoFromRow(row: Record<string, unknown>): Todo {
  return {
    id: String(row.id),
    title: String(row.title),
    priority: row.priority as 'high' | 'mid' | 'low',
    dueDate: (row.due_date as string | null) ?? null,
    completedAt: (row.completed_at as number | null) ?? null,
    archivedDate: (row.archived_date as string | null) ?? null,
    createdAt: Number(row.created_at),
    order: Number(row.sort_order),
    pinnedToHome: Boolean(row.pinned_to_home),
    pinOrder: Number(row.pin_order),
    groupId: (row.group_id as string | null) ?? null,
    section: (row.section as string | null) ?? null,
    deletedAt: (row.deleted_at as number | undefined) ?? undefined,
  };
}
