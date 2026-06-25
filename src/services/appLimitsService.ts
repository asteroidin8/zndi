import { getSupabase } from '@/lib/supabase';

type AppLimits = {
  boards: { free: number; pro: number };
  board_members: { free: number; pro: number };
  routine_groups: { free: number; pro: number };
  todo_groups: { free: number; pro: number };
};

let cached: AppLimits | null = null;

const DEFAULTS: AppLimits = {
  boards: { free: 3, pro: 7 },
  board_members: { free: 5, pro: 15 },
  routine_groups: { free: 1, pro: 999 },
  todo_groups: { free: 1, pro: 999 },
};

export async function fetchAppLimits(): Promise<AppLimits> {
  if (cached) return cached;

  const supabase = getSupabase();
  if (!supabase) return DEFAULTS;

  const { data, error } = await supabase.from('app_limits').select('*');
  if (error || !data) return DEFAULTS;

  const limits = { ...DEFAULTS };
  for (const row of data) {
    const r = row as { key: string; free_limit: number; pro_limit: number };
    if (r.key in limits) {
      (limits as Record<string, { free: number; pro: number }>)[r.key] = {
        free: r.free_limit,
        pro: r.pro_limit,
      };
    }
  }
  cached = limits;
  return limits;
}

export function clearAppLimitsCache() {
  cached = null;
}
