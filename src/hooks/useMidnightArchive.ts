import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useRoutineCompletionStore } from '@/stores/useRoutineCompletionStore';
import { useTodoStore } from '@/stores/useTodoStore';
import { localDateStr } from '@/utils/dateFormat';

function getTodayStr() {
  return localDateStr();
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/**
 * 앱이 포그라운드로 돌아올 때마다 날짜를 체크하고,
 * 자정이 지난 경우 완료된 투두를 아카이브 처리.
 * 미완료 투두는 자동으로 다음 날로 이월(별도 처리 없음 — dueDate 없으면 오늘 목록에 계속 노출).
 */
export function useMidnightArchive() {
  const { lastArchiveDate, archiveCompletedTodos } = useTodoStore();
  const clearOldCompletions = useRoutineCompletionStore((s) => s.clearOldCompletions);

  function checkAndArchive() {
    const today = getTodayStr();
    if (lastArchiveDate !== today) {
      archiveCompletedTodos(today);
    }
    clearOldCompletions();
  }

  useEffect(() => {
    // 앱 시작 시 체크
    checkAndArchive();

    // 앱 포그라운드 복귀 시 체크
    function handleAppState(state: AppStateStatus) {
      if (state === 'active') {
        checkAndArchive();
      }
    }

    const sub = AppState.addEventListener('change', handleAppState);

    // 자정에 자동 실행하는 타이머
    const msUntilMidnight = getMsUntilMidnight();
    const timer = setTimeout(() => {
      checkAndArchive();
    }, msUntilMidnight + 100); // 100ms 여유

    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
