import type { ViewStyle } from 'react-native';

import { spacing } from '@/constants/spacing';

/** 설정 카드 row 좌우·divider inset (통일) */
export const SETTING_ROW_INSET = spacing.card;

/** 설정 카드 상하 여백 */
export const SETTING_CARD_INSET_Y = spacing.xs;

/** iOS Settings 기준 row 높이 */
export const SETTING_ROW_HEIGHT = 56;

/** 세그먼트·버튼 — row 높이 안에 맞춤 */
export const SETTING_CONTROL_HEIGHT = spacing.section + spacing.sm;

/** navigation·choice·destructive·theme 등 1줄 row */
export function settingCompactRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SETTING_ROW_HEIGHT,
    paddingHorizontal: SETTING_ROW_INSET,
  };
}

/** 알림 등 제목+설명 row */
export function settingRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SETTING_ROW_HEIGHT,
    paddingHorizontal: SETTING_ROW_INSET,
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
    paddingHorizontal: SETTING_ROW_INSET,
    gap: spacing.sm,
  };
}
