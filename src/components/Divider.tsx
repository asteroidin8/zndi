import { View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  spacing?: number;
};

export function Divider({ spacing = 0 }: Props) {
  const c = useThemeColors();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: c.border,
        marginVertical: spacing,
      }}
    />
  );
}
