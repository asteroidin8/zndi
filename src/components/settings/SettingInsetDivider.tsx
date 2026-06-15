import { View } from 'react-native';

import { SETTING_ROW_INSET } from './settingStyles';
import { useThemeColors } from '@/hooks/useThemeColors';

export function SettingInsetDivider() {
  const c = useThemeColors();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: c.borderNeutral,
        marginLeft: SETTING_ROW_INSET,
      }}
    />
  );
}
