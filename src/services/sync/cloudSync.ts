import { getSupabase } from '@/lib/supabase';
import { useFastingStore } from '@/stores/useFastingStore';
import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAvatarStore } from '@/stores/useAvatarStore';
import { withCloudSyncSuppressed } from '@/services/sync/cloudSyncGuard';
import { getDirtyIds, clearDirty, hasDirtyIds } from '@/services/sync/dirtyTracker';
import { routineFromRow, todoFromRow } from '@/utils/rowMappers';

export async function checkNicknameTaken(nickname: string, _currentUserId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_nickname_available', { name: nickname });
  if (error) return false;
  return data === false;
}

/** 로컬 Zustand → Supabase upsert (클라우드 백업) */
export async function pushLocalToCloud(userId: string, dirtyStores?: Set<string>): Promise<{ error?: string }> {
  return withCloudSyncSuppressed(async () => {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const pushAll = !dirtyStores || dirtyStores.size === 0;
  const shouldPush = (name: string) => pushAll || dirtyStores!.has(name);

  const { profile, weightRecords } = useUserStore.getState();
  const routines = useRoutineStore.getState().routines;
  const routineGroups = useRoutineStore.getState().groups;
  const todos = useTodoStore.getState().todos;
  const todoGroups = useTodoStore.getState().groups;
  const completions = useRoutineCompletionStore.getState().completions;
  const records = useFastingStore.getState().records;

  const now = new Date().toISOString();

  if (shouldPush('user')) {
    const avatarId = useAvatarStore.getState().equippedId || null;
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: userId,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      target_weight_kg: profile.targetWeightKg,
      age_years: profile.ageYears,
      is_male: profile.isMale,
      nickname: profile.nickname,
      avatar_id: avatarId,
      updated_at: now,
    });
    if (profileError) return { error: profileError.message };

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
  }

  if (shouldPush('routines')) {
    const dirtyGroupIds = getDirtyIds('routine_groups');
    const dirtyRoutineGroups = hasDirtyIds('routine_groups')
      ? routineGroups.filter((g) => dirtyGroupIds.has(g.id))
      : routineGroups;
    if (dirtyRoutineGroups.length > 0) {
      const { error } = await supabase.from('routine_groups').upsert(
        dirtyRoutineGroups.map((g) => ({
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
    clearDirty('routine_groups');

    const dirtyRIds = getDirtyIds('routines');
    const dirtyRoutines = hasDirtyIds('routines')
      ? routines.filter((r) => dirtyRIds.has(r.id))
      : routines;
    if (dirtyRoutines.length > 0) {
      const { error } = await supabase.from('routines').upsert(
        dirtyRoutines.map((r) => ({
          user_id: userId,
          id: r.id,
          name: r.name,
          repeat_type: r.repeatType ?? 'weekly',
          repeat_days: r.repeatDays ?? [],
          month_dates: r.monthDates ?? [],
          repeat_interval: r.repeatInterval ?? 1,
          section: r.section ?? null,
          reminder_time: r.reminderTime,
          sort_order: r.order,
          group_id: r.groupId ?? null,
          created_at: r.createdAt,
          deleted_at: r.deletedAt ?? null,
          updated_at: now,
        })),
      );
      if (error) return { error: error.message };
    }
    clearDirty('routines');
  }

  if (shouldPush('todos')) {
    const dirtyTGroupIds = getDirtyIds('todo_groups');
    const dirtyTodoGroups = hasDirtyIds('todo_groups')
      ? todoGroups.filter((g) => dirtyTGroupIds.has(g.id))
      : todoGroups;
    if (dirtyTodoGroups.length > 0) {
      const { error } = await supabase.from('todo_groups').upsert(
        dirtyTodoGroups.map((g) => ({
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
    clearDirty('todo_groups');

    const dirtyTIds = getDirtyIds('todos');
    const dirtyTodos = hasDirtyIds('todos')
      ? todos.filter((t) => dirtyTIds.has(t.id))
      : todos;
    if (dirtyTodos.length > 0) {
      const { error } = await supabase.from('todos').upsert(
        dirtyTodos.map((t) => ({
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
          deleted_at: t.deletedAt ?? null,
          updated_at: now,
        })),
      );
      if (error) return { error: error.message };
    }
    clearDirty('todos');
  }

  if (shouldPush('completions')) {
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
  }

  if (shouldPush('fasting')) {
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
  }

  await supabase.from('sync_state').upsert({
    user_id: userId,
    last_pushed_at: now,
  });

  return {};
  });
}

type DeletableTable =
  | 'routines' | 'todos' | 'fasting_records' | 'routine_completions'
  | 'weight_records' | 'routine_groups' | 'todo_groups';

export async function updateAvatarInCloud(
  userId: string,
  avatarId: string | null,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, avatar_id: avatarId || null, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  return {};
}

export async function deleteCloudRecord(
  table: DeletableTable,
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
    const serverProfile = {
      heightCm: p.height_cm as number | null,
      weightKg: p.weight_kg as number | null,
      targetWeightKg: p.target_weight_kg as number | null,
      ageYears: p.age_years as number | null,
      isMale: p.is_male as boolean | null,
      nickname: (p.nickname as string | null) ?? null,
    };
    const local = useUserStore.getState().profile;
    const changed = Object.keys(serverProfile).some(
      (k) => serverProfile[k as keyof typeof serverProfile] !== local[k as keyof typeof local],
    );
    if (changed) {
      useUserStore.setState({ profile: serverProfile });
    }
    if (p.avatar_id && typeof p.avatar_id === 'string') {
      const localAvatar = useAvatarStore.getState().equippedId;
      if (localAvatar !== p.avatar_id) {
        useAvatarStore.getState().equip(p.avatar_id);
      }
    }
  }

  if (routineGroupsRes.data?.length) {
    const localGroups = useRoutineStore.getState().groups;
    const localGroupIds = new Set(localGroups.map((g) => g.id));
    const serverGroups = routineGroupsRes.data.map((g: Record<string, unknown>) => ({
      id: g.id as string,
      name: g.name as string,
      order: g.sort_order as number,
      collapsed: (g.collapsed as boolean) ?? false,
    }));
    const newGroups = serverGroups.filter((g) => !localGroupIds.has(g.id));
    if (newGroups.length > 0) {
      useRoutineStore.setState({
        groups: [...localGroups, ...newGroups].sort((a, b) => a.order - b.order),
      });
    }
  }

  if (routinesRes.data?.length) {
    const serverRoutines = routinesRes.data
      .map((r) => routineFromRow(r as Record<string, unknown>));
    const localRoutines = useRoutineStore.getState().routines;
    const localIds = new Set(localRoutines.map((r) => r.id));
    const newFromServer = serverRoutines.filter((r) => !localIds.has(r.id));
    if (newFromServer.length > 0) {
      const merged = [...localRoutines, ...newFromServer].sort((a, b) => a.order - b.order);
      useRoutineStore.setState({ routines: merged });
    }
  }

  if (todoGroupsRes.data?.length) {
    const localTodoGroups = useTodoStore.getState().groups;
    const localTodoGroupIds = new Set(localTodoGroups.map((g) => g.id));
    const serverTodoGroups = todoGroupsRes.data.map((g: Record<string, unknown>) => ({
      id: g.id as string,
      name: g.name as string,
      order: g.sort_order as number,
      collapsed: (g.collapsed as boolean) ?? false,
    }));
    const newTodoGroups = serverTodoGroups.filter((g) => !localTodoGroupIds.has(g.id));
    if (newTodoGroups.length > 0) {
      useTodoStore.setState({
        groups: [...localTodoGroups, ...newTodoGroups].sort((a, b) => a.order - b.order),
      });
    }
  }

  if (todosRes.data?.length) {
    const serverTodos = todosRes.data
      .map((t) => todoFromRow(t as Record<string, unknown>));
    const localTodos = useTodoStore.getState().todos;
    const localTodoIds = new Set(localTodos.map((t) => t.id));
    const newTodosFromServer = serverTodos.filter((t) => !localTodoIds.has(t.id));
    if (newTodosFromServer.length > 0) {
      const mergedTodos = [...localTodos, ...newTodosFromServer].sort((a, b) => a.order - b.order);
      useTodoStore.setState({ todos: mergedTodos });
    }
  }

  if (completionsRes.data?.length) {
    const localCompletions = useRoutineCompletionStore.getState().completions;
    let hasNew = false;
    const merged = { ...localCompletions };
    for (const row of completionsRes.data) {
      if (!(row.completion_key in merged)) {
        merged[row.completion_key] = row.completed_at;
        hasNew = true;
      }
    }
    if (hasNew) {
      useRoutineCompletionStore.setState({ completions: merged });
    }
  }

  if (fastingRes.data?.length) {
    const localRecords = useFastingStore.getState().records;
    const localRecordIds = new Set(localRecords.map((r) => r.id));
    const serverRecords = fastingRes.data.map((r) => ({
      id: r.id as string,
      startedAt: r.started_at as number,
      endedAt: r.ended_at as number | null,
      goalHours: Number(r.goal_hours),
      result: r.result as import('@/types').FastingResult | null,
    }));
    const newRecords = serverRecords.filter((r) => !localRecordIds.has(r.id));
    if (newRecords.length > 0) {
      useFastingStore.setState({ records: [...localRecords, ...newRecords] });
    }
  }

  if (weightRes.data?.length) {
    const localWeight = useUserStore.getState().weightRecords;
    const localWeightIds = new Set(localWeight.map((w) => w.id));
    const serverWeight = weightRes.data.map((w: Record<string, unknown>) => ({
      id: w.id as string,
      date: w.date as string,
      weightKg: Number(w.weight_kg),
      createdAt: w.created_at as number,
    }));
    const newWeight = serverWeight.filter((w) => !localWeightIds.has(w.id));
    if (newWeight.length > 0) {
      useUserStore.setState({
        weightRecords: [...localWeight, ...newWeight].sort((a, b) => a.date.localeCompare(b.date)),
      });
    }
  }

  return {};
  });
}
