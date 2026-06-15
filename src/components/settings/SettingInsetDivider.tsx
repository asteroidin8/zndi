import { View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

/** 카드 padding 안쪽 전체 너비 구분선 */
export function SettingInsetDivider() {
  const c = useThemeColors();

  return (
    <View
      style={{
        height: 1,
        width: '100%',
        backgroundColor: c.borderNeutral,
      }}
    />
  );
}
