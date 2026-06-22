import { Alert } from 'react-native';

import { useProStore } from '@/stores/useProStore';

const PRO_ALERT_TITLE = 'Pro 기능';
const PRO_ALERT_MSG = '이 기능은 Pro 구독에서 사용할 수 있어요.';

export function useProGating() {
  const isPro = useProStore((s) => s.isPro);

  function requirePro(callback: () => void) {
    if (isPro) {
      callback();
      return;
    }
    Alert.alert(PRO_ALERT_TITLE, PRO_ALERT_MSG);
  }

  return { isPro, requirePro };
}

export const FREE_LIMITS = {
  routineGroups: 1,
  todoGroups: 1,
  boards: 1,
} as const;
