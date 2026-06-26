import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { MIN_BACKGROUND_MS } from '@/constants/timing';
import { useAuth } from '@/contexts/AuthProvider';
import { getSupabase } from '@/lib/supabase';
import { useBoardStore } from '@/stores/useBoardStore';
import { fetchMyBoards } from '@/services/board/boardService';

import type { RealtimeChannel } from '@supabase/supabase-js';

function subscribeBoardChannel(supabase: ReturnType<typeof getSupabase> & object, userId: string, boardIds: string[]): RealtimeChannel {
  return supabase
    .channel(`boards:${userId}`)
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
          const delUserId = String((payload.old as Record<string, unknown>).user_id);
          if (delUserId === userId) {
            if (!useBoardStore.getState().boards.some((b) => b.id === boardId)) return;
            useBoardStore.getState().removeBoard(boardId);
          } else {
            const members = useBoardStore.getState().members[boardId] ?? [];
            if (!members.some((m) => m.userId === delUserId)) return;
            useBoardStore.getState().removeMember(boardId, delUserId);
          }
          return;
        }

        if (payload.eventType === 'INSERT') {
          const newUserId = String(row!.user_id);
          const existing = (useBoardStore.getState().members[boardId] ?? []).find((m) => m.userId === newUserId);
          if (existing) return;
          useBoardStore.getState().addMember({
            boardId,
            userId: newUserId,
            nickname: String(row!.nickname),
            joinedAt: String(row!.joined_at),
            role: (row!.role as string as import('@/types').BoardMemberRole) ?? 'member',
          });
        } else if (payload.eventType === 'UPDATE' && row) {
          const store = useBoardStore.getState();
          const current = store.members[boardId] ?? [];
          const updatedUserId = String(row.user_id);
          const newNickname = String(row.nickname);
          const newRole = (row.role as string as import('@/types').BoardMemberRole) ?? 'member';
          const target = current.find((m) => m.userId === updatedUserId);
          if (!target || (target.nickname === newNickname && target.role === newRole)) return;
          store.setMembers(
            boardId,
            current.map((m) =>
              m.userId === updatedUserId
                ? { ...m, nickname: newNickname, role: newRole }
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
}

export function useBoardRealtimeSync() {
  const { user } = useAuth();
  const boardCount = useBoardStore((s) => s.boards.length);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const backgroundAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id || boardCount === 0) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const userId = user.id;

    function connect() {
      if (channelRef.current) return;
      const boardIds = useBoardStore.getState().boards.map((b) => b.id);
      channelRef.current = subscribeBoardChannel(supabase!, userId, boardIds);
    }

    function disconnect() {
      if (!channelRef.current) return;
      void supabase!.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    connect();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (backgroundAtRef.current !== null) {
          const elapsed = Date.now() - backgroundAtRef.current;
          backgroundAtRef.current = null;
          connect();
          if (elapsed >= MIN_BACKGROUND_MS) {
            void fetchMyBoards(userId);
          }
        }
      } else if (state === 'background') {
        backgroundAtRef.current = Date.now();
        disconnect();
      }
    });

    return () => {
      sub.remove();
      disconnect();
    };
  }, [user?.id, boardCount]);
}
