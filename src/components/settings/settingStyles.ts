import type { ViewStyle } from 'react-native';

import { spacing } from '@/constants/spacing';

/** RoutineItem·설정 row 공통 높이 (spacing.section × 2) */
export const SETTING_ROW_HEIGHT = spacing.section * 2;

export function settingRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SETTING_ROW_HEIGHT,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.item,
    gap: spacing.item,
  };
}
