import { useBoardProgressSync } from '@/hooks/useBoardProgressSync';
import { useBoardRealtimeSync } from '@/hooks/useBoardRealtimeSync';
import { useFastingNotification } from '@/hooks/useFastingNotification';
import { useMidnightArchive } from '@/hooks/useMidnightArchive';
import { useRoutineNotifications } from '@/hooks/useRoutineNotifications';
import { useTodoNotifications } from '@/hooks/useTodoNotifications';
import { useWidgetSync } from '@/widgets/useWidgetSync';

/** 루트 레이아웃 리렌더 없이 side-effect 훅만 실행 */
export function AppEffectsBridge() {
  useBoardRealtimeSync();
  useBoardProgressSync();
  useFastingNotification();
  useMidnightArchive();
  useRoutineNotifications();
  useTodoNotifications();
  useWidgetSync();
  return null;
}
