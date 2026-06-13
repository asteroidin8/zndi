import type { ViewStyle } from 'react-native';

import { spacing } from '@/constants/spacing';

/** iOS Settings 기준 단일 row 높이 */
export const SETTING_ROW_HEIGHT = spacing.section * 2;

/** 세그먼트·버튼 — row 높이 안에 맞춤 */
export const SETTING_CONTROL_HEIGHT = spacing.section + spacing.sm;

/** navigation·choice·destructive·theme 등 1줄 row */
export function settingCompactRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SETTING_ROW_HEIGHT,
    paddingHorizontal: spacing.card,
  };
}

/** 알림 등 제목+설명 row */
export function settingRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SETTING_ROW_HEIGHT,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.sm,
  };
}

/** row 왼쪽 label */
export function settingRowLabelStyle(): ViewStyle {
  return {
    flexShrink: 0,
  };
}

/** row 오른쪽 — value·chevron·segment 버튼 그룹 */
export function settingRowTrailingStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 1,
    minWidth: 0,
    gap: spacing.sm,
  };
}

/** full-width segment·버튼 row (테마 카드) */
export function settingSegmentRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    height: SETTING_ROW_HEIGHT,
    paddingHorizontal: spacing.card,
    gap: spacing.sm,
  };
}
