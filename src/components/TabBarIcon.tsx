import * as LucideIcons from 'lucide-react-native';

type IconName = keyof typeof LucideIcons;

type Props = {
  name: IconName;
  color: string;
  size?: number;
};

export function TabBarIcon({ name, color, size = 22 }: Props) {
  const Icon = LucideIcons[name] as React.ComponentType<{
    color: string;
    size: number;
    strokeWidth: number;
  }>;

  return <Icon color={color} size={size} strokeWidth={1.5} />;
}
