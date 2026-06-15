import { View } from 'react-native';

import type { TodoPriority } from '@/stores/useTodoStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPriorityColor } from '@/utils/dateFormat';

const PRIORITY_A11Y: Record<TodoPriority, string> = {
  high: '중요도 높음',
  mid: '중요도 보통',
  low: '중요도 낮음',
};

type Props = {
  priority: TodoPriority;
  size?: number;
};

/** 할일 중요도 색 점 — 홈 요약·할일 목록 공통 */
export function TodoPriorityBadge({ priority, size = 8 }: Props) {
  const c = useThemeColors();

  return (
    <View
      accessibilityLabel={PRIORITY_A11Y[priority]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getPriorityColor(priority, c),
      }}
    />
  );
}
