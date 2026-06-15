import type { ViewStyle } from 'react-native';

import { spacing } from '@/constants/spacing';

/** SettingsList(Card) 좌우·상하 패딩 — row/block은 이 inset 안에서만 배치 */
export const SETTING_CARD_PADDING_X = spacing.card;
export const SETTING_CARD_PADDING_Y = spacing.xs;

/** @deprecated SETTING_CARD_PADDING_X */
export const SETTING_ROW_INSET = SETTING_CARD_PADDING_X;

/** @deprecated SETTING_CARD_PADDING_Y */
export const SETTING_CARD_INSET_Y = SETTING_CARD_PADDING_Y;

/** iOS Settings 기준 row 높이 */
export const SETTING_ROW_HEIGHT = 56;

/** 세그먼트·버튼 — row 높이 안에 맞춤 */
export const SETTING_CONTROL_HEIGHT = spacing.section + spacing.sm;

export function settingCardStyle(): ViewStyle {
  return {
    paddingHorizontal: SETTING_CARD_PADDING_X,
    paddingVertical: SETTING_CARD_PADDING_Y,
  };
}

/** 카드 내부 row 공통 — padding은 카드, 정렬은 row */
export function settingRowBaseStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SETTING_ROW_HEIGHT,
    width: '100%',
  };
}

/** navigation·choice·destructive 등 1줄 row */
export function settingCompactRowStyle(): ViewStyle {
  return settingRowBaseStyle();
}

/** 알림 등 제목+설명 row */
export function settingRowStyle(): ViewStyle {
  return {
    ...settingRowBaseStyle(),
    paddingVertical: spacing.sm,
  };
}

/** row 왼쪽 label */
export function settingRowLabelStyle(): ViewStyle {
  return {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  };
}

/** row 오른쪽 — value·chevron·segment 버튼 그룹 */
export function settingRowTrailingStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    gap: spacing.sm,
  };
}

/** full-width segment·버튼 row (테마 카드) */
export function settingSegmentRowStyle(): ViewStyle {
  return {
    ...settingRowBaseStyle(),
    gap: spacing.sm,
  };
}

/** 로그인·안내·로딩 등 full-width 블록 */
export function settingCardBlockStyle(options?: { centered?: boolean }): ViewStyle {
  return {
    width: '100%',
    minHeight: SETTING_ROW_HEIGHT,
    alignItems: options?.centered ? 'center' : 'stretch',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  };
}
