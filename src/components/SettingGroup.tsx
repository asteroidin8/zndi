import { View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  children: React.ReactNode;
};

export function SettingGroup({ children }: Props) {
  const c = useThemeColors();
  return (
    <View
      style={{
        marginHorizontal: spacing.screen,
        backgroundColor: c.surfaceSubtle,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        overflow: 'hidden',
        marginBottom: spacing.sm,
      }}
    >
      {children}
    </View>
  );
}
