import * as LucideIcons from 'lucide-react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = keyof typeof LucideIcons;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 20, color, strokeWidth = 1.5 }: Props) {
  const c = useThemeColors();

  const Icon = LucideIcons[name] as React.ComponentType<{
    color: string;
    size: number;
    strokeWidth: number;
  }>;

  return <Icon color={color ?? c.ink} size={size} strokeWidth={strokeWidth} />;
}
