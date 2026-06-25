import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { useAutoCloudSync } from '@/hooks/useAutoCloudSync';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { getSupabase } from '@/lib/supabase';
import { useProStore } from '@/stores/useProStore';

export function CloudSyncBridge() {
  const { user } = useAuth();
  useRealtimeSync();
  useAutoCloudSync();

  const setPro = useProStore((s) => s.setPro);
  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.rpc('get_pro_status').then(({ data, error }) => {
      if (error || !data) return;
      const status = data as { is_pro: boolean; source: string };
      setPro(status.is_pro);
    });
  }, [user?.id, setPro]);

  return null;
}
