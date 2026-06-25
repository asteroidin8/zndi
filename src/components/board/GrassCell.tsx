import { View } from 'react-native';

import { getCellBorderRadius, GRASS_OPACITY } from '@/constants/grassTheme';
import type { GrassCellShape } from '@/constants/grassTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

export function GrassCell({
  level,
  size,
  grassHex,
  shape,
}: {
  level: number;
  size: number;
  grassHex: string;
  shape: GrassCellShape;
}) {
  const c = useThemeColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: getCellBorderRadius(shape, size),
        backgroundColor: level === 0 ? c.surfaceMuted : grassHex,
        opacity: level === 0 ? 1 : GRASS_OPACITY[level],
        borderWidth: level === 0 ? 1 : 0,
        borderColor: c.border,
      }}
    />
  );
}
