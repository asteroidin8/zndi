import { getSupabase } from '@/lib/supabase';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import type { Weekday } from '@/stores/useRoutineStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';

/** 로컬 Zustand → Supabase upsert (클라우드 백업) */
export async function pushLocalToCloud(userId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const profile = useUserStore.getState().profile;
  const routines = useRoutineStore.getState().routines;
  const todos = useTodoStore.getState().todos;
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
    updated_at: now,
  });
  if (profileError) return { error: profileError.message };

  if (routines.length > 0) {
    const { error } = await supabase.from('routines').upsert(
      routines.map((r) => ({
        user_id: userId,
        id: r.id,
        name: r.name,
        repeat_days: r.repeatDays,
        reminder_time: r.reminderTime,
        sort_order: r.order,
        created_at: r.createdAt,
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

  await supabase.from('sync_state').upsert({
    user_id: userId,
    last_pushed_at: now,
  });

  return {};
}

/** Supabase → 로컸 pull (최초 로그인·복원) */
export async function pullCloudToLocal(userId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const [profileRes, routinesRes, todosRes, completionsRes, fastingRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('routines').select('*').eq('user_id', userId),
    supabase.from('todos').select('*').eq('user_id', userId),
    supabase.from('routine_completions').select('*').eq('user_id', userId),
    supabase.from('fasting_records').select('*').eq('user_id', userId),
  ]);

  if (profileRes.error) return { error: profileRes.error.message };
  if (routinesRes.error) return { error: routinesRes.error.message };
  if (todosRes.error) return { error: todosRes.error.message };
  if (completionsRes.error) return { error: completionsRes.error.message };
  if (fastingRes.error) return { error: fastingRes.error.message };

  if (profileRes.data) {
    useUserStore.setState({
      profile: {
        heightCm: profileRes.data.height_cm,
        weightKg: profileRes.data.weight_kg,
        targetWeightKg: profileRes.data.target_weight_kg,
        ageYears: profileRes.data.age_years,
        isMale: profileRes.data.is_male,
        nickname: (profileRes.data as { nickname?: string | null }).nickname ?? null,
      },
    });
  }

  if (routinesRes.data?.length) {
    useRoutineStore.setState({
      routines: routinesRes.data
        .map((r) => ({
          id: r.id,
          name: r.name,
          repeatDays: r.repeat_days as Weekday[],
          reminderTime: r.reminder_time,
          createdAt: r.created_at,
          order: r.sort_order,
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

  return {};
}
