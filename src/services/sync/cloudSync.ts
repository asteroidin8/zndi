import { getSupabase } from '@/lib/supabase';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import type { Weekday } from '@/stores/useRoutineStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { withCloudSyncSuppressed } from '@/services/sync/cloudSyncGuard';

export async function checkNicknameTaken(nickname: string, _currentUserId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_nickname_available', { name: nickname });
  if (error) return false;
  return data === false;
}

/** 로컬 Zustand → Supabase upsert (클라우드 백업) */
export async function pushLocalToCloud(userId: string): Promise<{ error?: string }> {
  return withCloudSyncSuppressed(async () => {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { profile, weightRecords } = useUserStore.getState();
  const routines = useRoutineStore.getState().routines;
  const routineGroups = useRoutineStore.getState().groups;
  const todos = useTodoStore.getState().todos;
  const todoGroups = useTodoStore.getState().groups;
  const completions = useRoutineCompletionStore.getState().completions;
  const records = useFastingStore.getState().records;

  const now = new Date().toISOString();

  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: userId,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    target_weight_kg: profile.targetWeightKg,
    age_years: profile.ageYears,
    is_male: profile.isMale,
    nickname: profile.nickname,
    updated_at: now,
  });
  if (profileError) return { error: profileError.message };

  if (routineGroups.length > 0) {
    const { error } = await supabase.from('routine_groups').upsert(
      routineGroups.map((g) => ({
        user_id: userId,
        id: g.id,
        name: g.name,
        sort_order: g.order,
        collapsed: g.collapsed,
        updated_at: now,
      })),
    );
    if (error) return { error: error.message };
  }

  if (routines.length > 0) {
    const { error } = await supabase.from('routines').upsert(
      routines.map((r) => ({
        user_id: userId,
        id: r.id,
        name: r.name,
        repeat_type: r.repeatType ?? 'weekly',
        repeat_days: r.repeatDays,
        month_dates: r.monthDates ?? [],
        repeat_interval: r.repeatInterval ?? 1,
        section: r.section ?? null,
        reminder_time: r.reminderTime,
        sort_order: r.order,
        group_id: r.groupId ?? null,
        created_at: r.createdAt,
        updated_at: now,
      })),
    );
    if (error) return { error: error.message };
  }

  if (todoGroups.length > 0) {
    const { error } = await supabase.from('todo_groups').upsert(
      todoGroups.map((g) => ({
        user_id: userId,
        id: g.id,
        name: g.name,
        sort_order: g.order,
        collapsed: g.collapsed,
        updated_at: now,
      })),
    );
    if (error) return { error: error.message };
  }

  if (todos.length > 0) {
    const { error } = await supabase.from('todos').upsert(
      todos.map((t) => ({
        user_id: userId,
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.dueDate,
        completed_at: t.completedAt,
        archived_date: t.archivedDate,
        created_at: t.createdAt,
        sort_order: t.order,
        pinned_to_home: t.pinnedToHome,
        pin_order: t.pinOrder,
        group_id: t.groupId ?? null,
        section: t.section ?? null,
        updated_at: now,
      })),
    );
    if (error) return { error: error.message };
  }

  const completionRows = Object.entries(completions).map(([key, ts]) => ({
    user_id: userId,
    completion_key: key,
    completed_at: ts,
    updated_at: now,
  }));
  if (completionRows.length > 0) {
    const { error } = await supabase.from('routine_completions').upsert(completionRows);
    if (error) return { error: error.message };
  }

  if (records.length > 0) {
    const { error } = await supabase.from('fasting_records').upsert(
      records.map((r) => ({
        user_id: userId,
        id: r.id,
        started_at: r.startedAt,
        ended_at: r.endedAt,
        goal_hours: r.goalHours,
        result: r.result,
        updated_at: now,
      })),
    );
    if (error) return { error: error.message };
  }

  if (weightRecords.length > 0) {
    const { error } = await supabase.from('weight_records').upsert(
      weightRecords.map((w) => ({
        user_id: userId,
        id: w.id,
        date: w.date,
        weight_kg: w.weightKg,
        created_at: w.createdAt,
        updated_at: now,
      })),
    );
    if (error) return { error: error.message };
  }

  await supabase.from('sync_state').upsert({
    user_id: userId,
    last_pushed_at: now,
  });

  return {};
  });
}

export async function deleteCloudRecord(
  table: string,
  id: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return { error: error.message };
  return {};
}

/** Supabase → 로컸 pull (최초 로그인·복원) */
export async function pullCloudToLocal(userId: string): Promise<{ error?: string }> {
  return withCloudSyncSuppressed(async () => {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const [profileRes, routineGroupsRes, routinesRes, todoGroupsRes, todosRes, completionsRes, fastingRes, weightRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('routine_groups').select('*').eq('user_id', userId),
    supabase.from('routines').select('*').eq('user_id', userId),
    supabase.from('todo_groups').select('*').eq('user_id', userId),
    supabase.from('todos').select('*').eq('user_id', userId),
    supabase.from('routine_completions').select('*').eq('user_id', userId),
    supabase.from('fasting_records').select('*').eq('user_id', userId),
    supabase.from('weight_records').select('*').eq('user_id', userId),
  ]);

  if (profileRes.error) return { error: profileRes.error.message };
  if (routinesRes.error) return { error: routinesRes.error.message };
  if (todosRes.error) return { error: todosRes.error.message };
  if (completionsRes.error) return { error: completionsRes.error.message };
  if (fastingRes.error) return { error: fastingRes.error.message };
  if (weightRes.error) return { error: weightRes.error.message };

  if (profileRes.data) {
    const p = profileRes.data as Record<string, unknown>;
    useUserStore.setState({
      profile: {
        heightCm: p.height_cm as number | null,
        weightKg: p.weight_kg as number | null,
        targetWeightKg: p.target_weight_kg as number | null,
        ageYears: p.age_years as number | null,
        isMale: p.is_male as boolean | null,
        nickname: (p.nickname as string | null) ?? null,
      },
    });
  }

  if (routineGroupsRes.data?.length) {
    useRoutineStore.setState({
      groups: routineGroupsRes.data
        .map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          order: g.sort_order as number,
          collapsed: (g.collapsed as boolean) ?? false,
        }))
        .sort((a, b) => a.order - b.order),
    });
  }

  if (routinesRes.data?.length) {
    useRoutineStore.setState({
      routines: routinesRes.data
        .map((r) => ({
          id: r.id,
          name: r.name,
          repeatType: ((r as Record<string, unknown>).repeat_type as string ?? 'weekly') as import('@/types').RepeatType,
          repeatDays: r.repeat_days as Weekday[],
          monthDates: ((r as Record<string, unknown>).month_dates as number[]) ?? [],
          repeatInterval: ((r as Record<string, unknown>).repeat_interval as number) ?? 1,
          section: ((r as Record<string, unknown>).section as string | null) ?? null,
          reminderTime: r.reminder_time,
          createdAt: r.created_at,
          order: r.sort_order,
          groupId: (r as Record<string, unknown>).group_id as string | null ?? null,
        }))
        .sort((a, b) => a.order - b.order),
    });
  }

  if (todoGroupsRes.data?.length) {
    useTodoStore.setState({
      groups: todoGroupsRes.data
        .map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          order: g.sort_order as number,
          collapsed: (g.collapsed as boolean) ?? false,
        }))
        .sort((a, b) => a.order - b.order),
    });
  }

  if (todosRes.data?.length) {
    useTodoStore.setState({
      todos: todosRes.data
        .map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.due_date,
          completedAt: t.completed_at,
          archivedDate: t.archived_date,
          createdAt: t.created_at,
          order: t.sort_order,
          pinnedToHome: t.pinned_to_home,
          pinOrder: t.pin_order,
          groupId: (t as Record<string, unknown>).group_id as string | null ?? null,
          section: ((t as Record<string, unknown>).section as string | null) ?? null,
        }))
        .sort((a, b) => a.order - b.order),
    });
  }

  if (completionsRes.data?.length) {
    const map: Record<string, number> = {};
    for (const row of completionsRes.data) {
      map[row.completion_key] = row.completed_at;
    }
    useRoutineCompletionStore.setState({ completions: map });
  }

  if (fastingRes.data?.length) {
    useFastingStore.setState({
      records: fastingRes.data.map((r) => ({
        id: r.id,
        startedAt: r.started_at,
        endedAt: r.ended_at,
        goalHours: Number(r.goal_hours),
        result: r.result,
      })),
    });
  }

  if (weightRes.data?.length) {
    useUserStore.setState({
      weightRecords: weightRes.data
        .map((w: Record<string, unknown>) => ({
          id: w.id as string,
          date: w.date as string,
          weightKg: Number(w.weight_kg),
          createdAt: w.created_at as number,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  return {};
  });
}
