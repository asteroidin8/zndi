import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthProvider';
import { getSupabase } from '@/lib/supabase';
import { isCloudSyncSuppressed } from '@/services/sync/cloudSyncGuard';
import { pullCloudToLocal } from '@/services/sync/cloudSync';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { routineFromRow, todoFromRow } from '@/utils/rowMappers';

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

function subscribeChannel(supabase: SupabaseClient, userId: string): RealtimeChannel {
  return supabase
    .channel(`sync:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (isCloudSyncSuppressed()) return;
        const row = payload.new as Record<string, unknown> | undefined;
        if (!row || payload.eventType === 'DELETE') return;
        const existing = useRoutineStore.getState().routines.find((r) => r.id === String(row.id));
        if (existing &&
          existing.name === String(row.name) &&
          existing.order === Number(row.sort_order) &&
          existing.section === ((row.section as string | null | undefined) ?? null) &&
          existing.groupId === ((row.group_id as string | null) ?? null) &&
          existing.reminderTime === ((row.reminder_time as string | null) ?? null)
        ) return;
        useRoutineStore.setState((state) => {
          const next = state.routines.filter((r) => r.id !== row.id);
          next.push(routineFromRow(row));
          return { routines: next.sort((a, b) => a.order - b.order) };
        });
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (isCloudSyncSuppressed()) return;
        const row = payload.new as Record<string, unknown> | undefined;
        if (!row) return;
        if (payload.eventType === 'DELETE') {
          const delId = (payload.old as { id: string }).id;
          if (!useTodoStore.getState().todos.some((t) => t.id === delId)) return;
          useTodoStore.setState((s) => ({
            todos: s.todos.filter((t) => t.id !== delId),
          }));
          return;
        }
        const existingTodo = useTodoStore.getState().todos.find((t) => t.id === String(row.id));
        if (existingTodo &&
          existingTodo.title === String(row.title) &&
          existingTodo.order === Number(row.sort_order) &&
          existingTodo.completedAt === ((row.completed_at as number | null) ?? null) &&
          existingTodo.groupId === ((row.group_id as string | null) ?? null) &&
          existingTodo.section === ((row.section as string | null) ?? null)
        ) return;
        useTodoStore.setState((state) => {
          const next = state.todos.filter((t) => t.id !== row.id);
          next.push(todoFromRow(row));
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
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (isCloudSyncSuppressed()) return;
        if (payload.eventType === 'DELETE') {
          const key = (payload.old as { completion_key: string }).completion_key;
          if (!(key in useRoutineCompletionStore.getState().completions)) return;
          useRoutineCompletionStore.setState((s) => {
            const next = { ...s.completions };
            delete next[key];
            return { completions: next };
          });
          return;
        }
        const row = payload.new as { completion_key: string; completed_at: number };
        if (useRoutineCompletionStore.getState().completions[row.completion_key] === row.completed_at) return;
        useRoutineCompletionStore.setState((s) => ({
          completions: { ...s.completions, [row.completion_key]: row.completed_at },
        }));
      },
    )
    .subscribe();
}

/** Phase 1: 본인 다기기 Realtime (루틴·할일·완료) — 백그라운드 시 해제 */
export function useRealtimeSync() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const wasBackgroundRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const userId = user.id;

    function connect() {
      if (channelRef.current) return;
      channelRef.current = subscribeChannel(supabase!, userId);
    }

    function disconnect() {
      if (!channelRef.current) return;
      void supabase!.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    connect();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (wasBackgroundRef.current) {
          connect();
          void pullCloudToLocal(userId);
          wasBackgroundRef.current = false;
        }
      } else if (state === 'background') {
        wasBackgroundRef.current = true;
        disconnect();
      }
    });

    return () => {
      sub.remove();
      disconnect();
    };
  }, [user?.id]);
}
