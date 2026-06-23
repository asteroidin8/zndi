import { View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  /** 세로 여백 */
  spacing?: number;
  /** 강조 구분선 */
  strong?: boolean;
};

export function Divider({ spacing = 0, strong = false }: Props) {
  const c = useThemeColors();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: strong ? c.border : c.borderNeutral,
        marginVertical: spacing,
      }}
    />
  );
}
