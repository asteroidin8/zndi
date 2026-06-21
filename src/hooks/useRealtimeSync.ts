import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { getSupabase } from '@/lib/supabase';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore, type Weekday } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';

/** Phase 1: 본인 다기기 Realtime (루틴·할일·완료) */
export function useRealtimeSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`sync:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          if (!row || payload.eventType === 'DELETE') return;
          useRoutineStore.setState((state) => {
            const next = state.routines.filter((r) => r.id !== row.id);
            next.push({
              id: String(row.id),
              name: String(row.name),
              repeatType: ((row.repeat_type as string | undefined) ?? 'weekly') as import('@/types').RepeatType,
              repeatDays: row.repeat_days as Weekday[],
              monthDates: (row.month_dates as number[] | undefined) ?? [],
              reminderTime: (row.reminder_time as string | null) ?? null,
              createdAt: Number(row.created_at),
              order: Number(row.sort_order),
              groupId: (row.group_id as string | null) ?? null,
            });
            return { routines: next.sort((a, b) => a.order - b.order) };
          });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          if (!row) return;
          if (payload.eventType === 'DELETE') {
            useTodoStore.setState((s) => ({
              todos: s.todos.filter((t) => t.id !== (payload.old as { id: string }).id),
            }));
            return;
          }
          useTodoStore.setState((state) => {
            const next = state.todos.filter((t) => t.id !== row.id);
            next.push({
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
            });
            return { todos: next.sort((a, b) => a.order - b.order) };
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routine_completions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const key = (payload.old as { completion_key: string }).completion_key;
            useRoutineCompletionStore.setState((s) => {
              const next = { ...s.completions };
              delete next[key];
              return { completions: next };
            });
            return;
          }
          const row = payload.new as { completion_key: string; completed_at: number };
          useRoutineCompletionStore.setState((s) => ({
            completions: { ...s.completions, [row.completion_key]: row.completed_at },
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
