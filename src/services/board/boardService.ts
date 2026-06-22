import { getSupabase } from '@/lib/supabase';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Board, BoardDailyProgress, BoardMember } from '@/types';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function rowToBoard(row: Record<string, unknown>): Board {
  return {
    id: String(row.id),
    name: String(row.name),
    inviteCode: String(row.invite_code),
    ownerId: String(row.owner_id),
    maxMembers: Number(row.max_members),
    createdAt: String(row.created_at),
  };
}

function rowToMember(row: Record<string, unknown>): BoardMember {
  return {
    boardId: String(row.board_id),
    userId: String(row.user_id),
    nickname: String(row.nickname),
    joinedAt: String(row.joined_at),
  };
}

function rowToProgress(row: Record<string, unknown>): BoardDailyProgress {
  return {
    boardId: String(row.board_id),
    userId: String(row.user_id),
    date: String(row.date),
    routineCompleted: Number(row.routine_completed),
    routineTotal: Number(row.routine_total),
    todoCompleted: Number(row.todo_completed),
    todoTotal: Number(row.todo_total),
    streak: Number(row.streak),
  };
}

export async function createBoard(
  userId: string,
  name: string,
  nickname: string,
): Promise<{ board?: Board; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const inviteCode = generateInviteCode();

  const { data, error } = await supabase
    .from('boards')
    .insert({ name, invite_code: inviteCode, owner_id: userId })
    .select()
    .single();
  if (error) return { error: error.message };

  const board = rowToBoard(data);

  const { error: memberError } = await supabase
    .from('board_members')
    .insert({ board_id: board.id, user_id: userId, nickname });
  if (memberError) return { error: memberError.message };

  const member: BoardMember = {
    boardId: board.id,
    userId,
    nickname,
    joinedAt: new Date().toISOString(),
  };

  useBoardStore.getState().addBoard(board);
  useBoardStore.getState().setMembers(board.id, [member]);

  return { board };
}

export async function joinBoard(
  userId: string,
  inviteCode: string,
  nickname: string,
): Promise<{ board?: Board; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data: boardData, error: findError } = await supabase
    .from('boards')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();
  if (findError || !boardData) return { error: '초대 코드를 찾을 수 없어요.' };

  const board = rowToBoard(boardData);

  const { data: existingMembers } = await supabase
    .from('board_members')
    .select('user_id')
    .eq('board_id', board.id);

  if (existingMembers) {
    if (existingMembers.some((m) => m.user_id === userId)) {
      return { error: '이미 참여 중인 보드예요.' };
    }
    if (existingMembers.length >= board.maxMembers) {
      return { error: '보드 인원이 가득 찼어요.' };
    }
  }

  const { error: joinError } = await supabase
    .from('board_members')
    .insert({ board_id: board.id, user_id: userId, nickname });
  if (joinError) return { error: joinError.message };

  return { board };
}

export async function leaveBoard(
  userId: string,
  boardId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const board = useBoardStore.getState().boards.find((b) => b.id === boardId);

  if (board?.ownerId === userId) {
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', userId);
    if (error) return { error: error.message };
  }

  useBoardStore.getState().removeBoard(boardId);
  return {};
}

export async function fetchMyBoards(userId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data: memberRows, error: memberError } = await supabase
    .from('board_members')
    .select('board_id')
    .eq('user_id', userId);
  if (memberError) return { error: memberError.message };
  if (!memberRows?.length) {
    useBoardStore.getState().setBoards([]);
    return {};
  }

  const boardIds = memberRows.map((r) => r.board_id);

  const { data: boardRows, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .in('id', boardIds);
  if (boardError) return { error: boardError.message };

  const boards = (boardRows ?? []).map((r) => rowToBoard(r as Record<string, unknown>));
  useBoardStore.getState().setBoards(boards);

  for (const board of boards) {
    await fetchBoardMembers(board.id);
    await fetchBoardProgress(board.id);
  }

  return {};
}

export async function fetchBoardMembers(boardId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', boardId);
  if (error) return { error: error.message };

  const members = (data ?? []).map((r) => rowToMember(r as Record<string, unknown>));
  useBoardStore.getState().setMembers(boardId, members);
  return {};
}

export async function fetchBoardProgress(boardId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const since = sevenDaysAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('board_daily_progress')
    .select('*')
    .eq('board_id', boardId)
    .gte('date', since);
  if (error) return { error: error.message };

  const progress = (data ?? []).map((r) => rowToProgress(r as Record<string, unknown>));
  useBoardStore.getState().setProgress(boardId, progress);
  return {};
}

export async function pushDailyProgress(
  userId: string,
  boardId: string,
  date: string,
  data: {
    routineCompleted: number;
    routineTotal: number;
    todoCompleted: number;
    todoTotal: number;
    streak: number;
  },
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase.from('board_daily_progress').upsert({
    board_id: boardId,
    user_id: userId,
    date,
    routine_completed: data.routineCompleted,
    routine_total: data.routineTotal,
    todo_completed: data.todoCompleted,
    todo_total: data.todoTotal,
    streak: data.streak,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  useBoardStore.getState().upsertProgress({
    boardId,
    userId,
    date,
    ...data,
  });

  return {};
}
