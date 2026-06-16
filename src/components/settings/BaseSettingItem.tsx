import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { SETTING_ROW_HEIGHT, SETTINGS_INSET } from './settingStyles';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** 설정 row 공통 shell — padding·높이·정렬 단일 규칙 */
export function BaseSettingItem({ children, onPress, accessibilityLabel }: Props) {
  const c = useThemeColors();

  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    minHeight: SETTING_ROW_HEIGHT,
    paddingHorizontal: SETTINGS_INSET,
    alignSelf: 'stretch' as const,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => ({
          ...style,
          backgroundColor: pressed ? c.surfaceMuted : 'transparent',
        })}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={style} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}
