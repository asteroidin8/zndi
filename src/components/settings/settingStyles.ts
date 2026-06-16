import type { ViewStyle } from 'react-native';

import { spacing } from '@/constants/spacing';

/** 설정 row·divider inset (화면 padding과 동일) */
export const SETTINGS_INSET = spacing.screen;

/** @deprecated SETTINGS_INSET */
export const SETTING_CARD_PADDING_X = SETTINGS_INSET;

/** @deprecated SETTINGS_INSET */
export const SETTING_ROW_INSET = SETTINGS_INSET;

export const SETTING_CARD_PADDING_Y = spacing.xs;

/** @deprecated SETTING_CARD_PADDING_Y */
export const SETTING_CARD_INSET_Y = SETTING_CARD_PADDING_Y;

/** iOS Settings 기준 row 높이 */
export const SETTING_ROW_HEIGHT = 56;

/** value ↔ chevron 간격 */
export const SETTING_VALUE_GAP = spacing.sm;

/** chevron 크기 */
export const SETTING_CHEVRON_SIZE = 17;

/** 세그먼트·버튼 — row 높이 안에 맞춤 */
export const SETTING_CONTROL_HEIGHT = spacing.section + spacing.sm;

/** SettingsList(Card) — row가 각자 inset padding */
export function settingCardStyle(): ViewStyle {
  return {
    paddingVertical: SETTING_CARD_PADDING_Y,
  };
}

/** @deprecated BaseSettingItem 사용 */
export function settingRowBaseStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SETTING_ROW_HEIGHT,
    paddingHorizontal: SETTINGS_INSET,
    width: '100%',
  };
}

/** @deprecated BaseSettingItem 사용 */
export function settingCompactRowStyle(): ViewStyle {
  return settingRowBaseStyle();
}

/** @deprecated BaseSettingItem 사용 */
export function settingRowStyle(): ViewStyle {
  return settingRowBaseStyle();
}

/** row 왼쪽 label */
export function settingRowLabelStyle(): ViewStyle {
  return {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  };
}

/** value + chevron 컨테이너 */
export function settingValueAccessoryStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SETTING_VALUE_GAP,
    flexShrink: 0,
  };
}

/** @deprecated settingValueAccessoryStyle */
export function settingRowTrailingStyle(): ViewStyle {
  return settingValueAccessoryStyle();
}

/** @deprecated BaseSettingItem + SettingSegmentTrack */
export function settingSegmentRowStyle(): ViewStyle {
  return {
    ...settingRowBaseStyle(),
    gap: spacing.sm,
  };
}

/** divider inset — row 텍스트 시작점과 일치 */
export function settingDividerStyle(): ViewStyle {
  return {
    height: 1,
    marginHorizontal: SETTINGS_INSET,
  };
}

/** 로그인·안내·로딩 등 full-width 블록 */
export function settingCardBlockStyle(options?: { centered?: boolean }): ViewStyle {
  return {
    width: '100%',
    minHeight: SETTING_ROW_HEIGHT,
    paddingHorizontal: SETTINGS_INSET,
    alignItems: options?.centered ? 'center' : 'stretch',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  };
}
