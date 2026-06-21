import { View } from 'react-native';

import { AppText } from './AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label?: string;
  count: number;
};

export function UngroupedHeader({ label = '미분류', count }: Props) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.screen,
        marginHorizontal: spacing.screen,
        marginTop: spacing.md,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: c.inkDisabled,
          marginRight: spacing.sm,
        }}
      />
      <AppText variant="caption" tone="disabled" style={{ flex: 1 }}>
        {label}
      </AppText>
      {count > 0 && (
        <AppText variant="caption" tone="disabled">{count}</AppText>
      )}
    </View>
  );
}
