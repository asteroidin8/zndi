import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { getSupabase } from '@/lib/supabase';
import { useBoardStore } from '@/stores/useBoardStore';

export function useBoardRealtimeSync() {
  const { user } = useAuth();
  const boardCount = useBoardStore((s) => s.boards.length);

  useEffect(() => {
    if (!user?.id || boardCount === 0) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const boardIds = useBoardStore.getState().boards.map((b) => b.id);

    const channel = supabase
      .channel(`boards:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_members' },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          const boardId = String(
            row?.board_id ?? (payload.old as Record<string, unknown>)?.board_id,
          );
          if (!boardIds.includes(boardId)) return;

          if (payload.eventType === 'DELETE') {
            const userId = String((payload.old as Record<string, unknown>).user_id);
            if (userId === user.id) {
              useBoardStore.getState().removeBoard(boardId);
            } else {
              useBoardStore.getState().removeMember(boardId, userId);
            }
            return;
          }

          if (payload.eventType === 'INSERT') {
            useBoardStore.getState().addMember({
              boardId,
              userId: String(row!.user_id),
              nickname: String(row!.nickname),
              joinedAt: String(row!.joined_at),
              role: (row!.role as string as import('@/types').BoardMemberRole) ?? 'member',
            });
          } else if (payload.eventType === 'UPDATE' && row) {
            const store = useBoardStore.getState();
            const current = store.members[boardId] ?? [];
            const updatedUserId = String(row.user_id);
            store.setMembers(
              boardId,
              current.map((m) =>
                m.userId === updatedUserId
                  ? { ...m, nickname: String(row.nickname), role: (row.role as string as import('@/types').BoardMemberRole) ?? m.role }
                  : m,
              ),
            );
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_daily_progress' },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          const row = payload.new as Record<string, unknown>;
          const boardId = String(row.board_id);
          if (!boardIds.includes(boardId)) return;

          useBoardStore.getState().upsertProgress({
            boardId,
            userId: String(row.user_id),
            date: String(row.date),
            routineCompleted: Number(row.routine_completed),
            routineTotal: Number(row.routine_total),
            todoCompleted: Number(row.todo_completed),
            todoTotal: Number(row.todo_total),
            streak: Number(row.streak),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, boardCount]);
}
