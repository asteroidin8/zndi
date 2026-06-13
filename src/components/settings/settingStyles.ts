import type { ViewStyle } from 'react-native';

import { spacing } from '@/constants/spacing';

/** iOS Settings 기준 단일 row 높이 */
export const SETTING_ROW_HEIGHT = spacing.section * 2;

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

/** 알림 등 제목+설명 row — 알림 섹션을 기준 높이로 사용 */
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

/** label 오른쪽 — value·chevron·segment */
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
