import { View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  /** 0–100 */
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
};

export function ProgressBar({ value, height = 4, color, trackColor }: Props) {
  const c = useThemeColors();
  const r = height / 2;
  const bar = color ?? c.primary;
  const track = trackColor ?? c.surfaceMuted;

  return (
    <View style={{ height, backgroundColor: track, borderRadius: r, overflow: 'hidden' }}>
      <View style={{ height, width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: bar, borderRadius: r }} />
    </View>
  );
}
