import { View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

export function SettingInsetDivider() {
  const c = useThemeColors();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: c.border,
        marginLeft: spacing.card,
      }}
    />
  );
}
