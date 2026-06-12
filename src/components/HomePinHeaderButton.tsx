import { Pressable } from 'react-native';

import { AppIcon } from './AppIcon';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  pinned: boolean;
  onPress: () => void;
};

export function HomePinHeaderButton({ pinned, onPress }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={pinned ? '홈 고정 해제' : '홈에 고정'}
    >
      <AppIcon name={pinned ? 'Pin' : 'PinOff'} size={20} color={pinned ? c.ink : c.inkTertiary} />
    </Pressable>
  );
}
