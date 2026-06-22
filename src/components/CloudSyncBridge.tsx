import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthProvider';
import { useAutoCloudSync } from '@/hooks/useAutoCloudSync';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useProStore } from '@/stores/useProStore';

const ADMIN_EMAILS = ['asteroidin8@gmail.com'];

/** 로그인 시 Realtime + 자동 클라우드 동기화 + 관리자 Pro 활성화 */
export function CloudSyncBridge() {
  const { user } = useAuth();
  useRealtimeSync();
  useAutoCloudSync();

  const setPro = useProStore((s) => s.setPro);
  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setPro(true);
    }
  }, [user?.email, setPro]);

  return null;
}
