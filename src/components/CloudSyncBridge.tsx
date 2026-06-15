import { useAuth } from '@/contexts/AuthProvider';
import { useAutoCloudSync } from '@/hooks/useAutoCloudSync';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

/** 로그인 시 Realtime + 자동 클라우드 동기화 */
export function CloudSyncBridge() {
  const { user } = useAuth();
  useRealtimeSync();
  useAutoCloudSync();
  if (!user) return null;
  return null;
}
