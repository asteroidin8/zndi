import { getSupabase } from '@/lib/supabase';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Board, BoardDailyProgress, BoardMember, BoardMemberRole } from '@/types';
import { localDateStr } from '@/utils/dateFormat';

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
    role: (row.role as BoardMemberRole) ?? 'member',
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

  const { data, error } = await supabase.rpc('create_board', {
    p_name: name,
    p_invite_code: inviteCode,
    p_nickname: nickname,
  });
  if (error) return { error: error.message };

  const row = data as Record<string, unknown>;
  const board = rowToBoard(row);

  const member: BoardMember = {
    boardId: board.id,
    userId,
    nickname,
    joinedAt: new Date().toISOString(),
    role: 'admin',
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

  const { data: lookupData, error: lookupError } = await supabase
    .rpc('lookup_board_by_invite', { code: inviteCode.toUpperCase() });
  if (lookupError || !lookupData) return { error: '초대 코드를 찾을 수 없어요.' };

  const lookup = lookupData as { id: string; name: string; max_members: number; member_count: number };
  if (!lookup.id) return { error: '초대 코드를 찾을 수 없어요.' };

  const boardId = lookup.id;

  const myBoards = useBoardStore.getState().boards;
  if (myBoards.some((b) => b.id === boardId)) {
    return { error: '이미 참여 중인 보드예요.' };
  }
  if (lookup.member_count >= lookup.max_members) {
    return { error: '보드 인원이 가득 찼어요.' };
  }

  const { error: joinError } = await supabase
    .from('board_members')
    .insert({ board_id: boardId, user_id: userId, nickname });
  if (joinError) {
    if (joinError.code === '23505') return { error: '이미 참여 중인 보드예요.' };
    return { error: joinError.message };
  }

  const board: Board = {
    id: boardId,
    name: lookup.name,
    inviteCode: inviteCode.toUpperCase(),
    ownerId: '',
    maxMembers: lookup.max_members,
    createdAt: new Date().toISOString(),
  };
  return { board };
}

export async function leaveBoard(
  userId: string,
  boardId: string,
): Promise<{ error?: string; boardDeleted?: boolean; newAdmin?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data, error } = await supabase.rpc('leave_board_v2', {
    p_board_id: boardId,
  });
  if (error) return { error: error.message };

  const result = data as { board_deleted?: boolean; new_admin?: string } | null;
  useBoardStore.getState().removeBoard(boardId);
  return {
    boardDeleted: result?.board_deleted ?? false,
    newAdmin: result?.new_admin,
  };
}

export async function delegateAdmin(
  boardId: string,
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase.rpc('delegate_admin', {
    p_board_id: boardId,
    p_target_user_id: targetUserId,
  });
  if (error) return { error: error.message };

  const store = useBoardStore.getState();
  const members = (store.members[boardId] ?? []).map((m) => {
    if (m.userId === targetUserId) return { ...m, role: 'admin' as const };
    if (m.role === 'admin') return { ...m, role: 'member' as const };
    return m;
  });
  useBoardStore.setState({
    members: { ...store.members, [boardId]: members },
    boards: store.boards.map((b) =>
      b.id === boardId ? { ...b, ownerId: targetUserId } : b,
    ),
  });
  return {};
}

export async function kickMember(
  boardId: string,
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase.rpc('kick_member', {
    p_board_id: boardId,
    p_target_user_id: targetUserId,
  });
  if (error) return { error: error.message };

  useBoardStore.getState().removeMember(boardId, targetUserId);
  return {};
}

export async function refreshInviteCode(
  boardId: string,
): Promise<{ newCode?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const newCode = generateInviteCode();
  const { error } = await supabase.rpc('refresh_invite_code', {
    p_board_id: boardId,
    p_new_code: newCode,
  });
  if (error) return { error: error.message };

  const store = useBoardStore.getState();
  useBoardStore.setState({
    boards: store.boards.map((b) =>
      b.id === boardId ? { ...b, inviteCode: newCode } : b,
    ),
  });
  return { newCode };
}

export async function voteDeleteBoard(
  boardId: string,
): Promise<{ deleted?: boolean; votes?: number; total?: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data, error } = await supabase.rpc('vote_delete_board', {
    p_board_id: boardId,
  });
  if (error) return { error: error.message };

  const result = data as { deleted: boolean; votes: number; total: number };
  if (result.deleted) {
    useBoardStore.getState().removeBoard(boardId);
  }
  return { deleted: result.deleted, votes: result.votes, total: result.total };
}

export async function unvoteDeleteBoard(
  boardId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase.rpc('unvote_delete_board', {
    p_board_id: boardId,
  });
  if (error) return { error: error.message };
  return {};
}

export async function insertSystemMessage(
  boardId: string,
  type: string,
  actorNickname: string,
  targetNickname?: string,
  routineName?: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase.from('board_system_messages').insert({
    board_id: boardId,
    type,
    actor_nickname: actorNickname,
    target_nickname: targetNickname ?? null,
    routine_name: routineName ?? null,
  });
  if (error) return { error: error.message };
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
  const since = localDateStr(sevenDaysAgo);

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

export async function updateMyNicknameInBoards(
  userId: string,
  nickname: string,
): Promise<{ error?: string }> {
  const store = useBoardStore.getState();
  const updatedMembers: Record<string, BoardMember[]> = {};
  for (const [boardId, memberList] of Object.entries(store.members)) {
    updatedMembers[boardId] = memberList.map((m) =>
      m.userId === userId ? { ...m, nickname } : m,
    );
  }
  const updatedLogs: Record<string, import('@/types').BoardVerificationLog[]> = {};
  for (const [boardId, logList] of Object.entries(store.logs)) {
    updatedLogs[boardId] = logList.map((l) =>
      l.userId === userId ? { ...l, nickname } : l,
    );
  }
  useBoardStore.setState({
    members: { ...store.members, ...updatedMembers },
    logs: { ...store.logs, ...updatedLogs },
  });

  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const [membersResult, profilesResult] = await Promise.all([
    supabase.from('board_members').update({ nickname }).eq('user_id', userId),
    supabase.from('profiles').update({ nickname }).eq('user_id', userId),
  ]);
  if (membersResult.error) return { error: membersResult.error.message };
  if (profilesResult.error) return { error: profilesResult.error.message };

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

  const { error } = await supabase.rpc('upsert_board_progress', {
    p_board_id: boardId,
    p_date: date,
    p_routine_completed: data.routineCompleted,
    p_routine_total: data.routineTotal,
    p_todo_completed: data.todoCompleted,
    p_todo_total: data.todoTotal,
    p_streak: data.streak,
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
