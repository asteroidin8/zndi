import { getSupabase } from '@/lib/supabase';
import { useFollowStore } from '@/stores/useFollowStore';
import type { FollowUser, UserDailyProgress } from '@/types';
import { localDateStr } from '@/utils/dateFormat';

export async function followUser(
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: (await supabase.auth.getUser()).data.user?.id, following_id: targetUserId });
  if (error) {
    if (error.code === '23505') return { error: '이미 팔로우 중이에요.' };
    return { error: error.message };
  }

  return {};
}

export async function unfollowUser(
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요해요.' };

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);
  if (error) return { error: error.message };

  return {};
}

export async function fetchFollowing(): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요해요.' };

  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id);
  if (error) return { error: error.message };

  if (!data?.length) {
    useFollowStore.getState().setFollowing([]);
    return {};
  }

  const followingIds = data.map((r) => r.following_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .in('user_id', followingIds);
  if (profileError) return { error: profileError.message };

  const following: FollowUser[] = (profiles ?? []).map((p) => ({
    userId: String(p.user_id),
    nickname: String(p.nickname ?? ''),
  }));
  useFollowStore.getState().setFollowing(following);

  return {};
}

export async function fetchFollowers(): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요해요.' };

  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', user.id);
  if (error) return { error: error.message };

  if (!data?.length) {
    useFollowStore.getState().setFollowers([]);
    return {};
  }

  const followerIds = data.map((r) => r.follower_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .in('user_id', followerIds);
  if (profileError) return { error: profileError.message };

  const followers: FollowUser[] = (profiles ?? []).map((p) => ({
    userId: String(p.user_id),
    nickname: String(p.nickname ?? ''),
  }));
  useFollowStore.getState().setFollowers(followers);

  return {};
}

export async function searchUsers(
  query: string,
): Promise<{ users: FollowUser[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { users: [], error: 'Supabase 미설정' };

  const { data, error } = await supabase.rpc('search_users_by_nickname', { query: query.trim() });
  if (error) return { users: [], error: error.message };

  const rows = (data ?? []) as { user_id: string; nickname: string }[];
  return {
    users: rows.map((r) => ({ userId: r.user_id, nickname: r.nickname })),
  };
}

export async function fetchFriendProgress(
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const since = localDateStr(thirtyDaysAgo);

  const { data, error } = await supabase
    .from('user_daily_progress')
    .select('*')
    .eq('user_id', targetUserId)
    .gte('date', since);
  if (error) return { error: error.message };

  const progress: UserDailyProgress[] = (data ?? []).map((r) => ({
    userId: String(r.user_id),
    date: String(r.date),
    routineCompleted: Number(r.routine_completed),
    routineTotal: Number(r.routine_total),
    todoCompleted: Number(r.todo_completed),
    todoTotal: Number(r.todo_total),
    streak: Number(r.streak),
  }));
  useFollowStore.getState().setFriendProgress(targetUserId, progress);

  return {};
}

export async function pushPersonalProgress(
  userId: string,
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

  const { error } = await supabase.from('user_daily_progress').upsert({
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

  return {};
}
