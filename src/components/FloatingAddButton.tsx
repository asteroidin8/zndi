import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from './AppIcon';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

/** 탭바 높이(아이콘+라벨+패딩) 대략값 */
const TAB_BAR_HEIGHT = 52;

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
};

export function FloatingAddButton({ onPress, accessibilityLabel }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        position: 'absolute',
        right: spacing.screen,
        bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 6) + spacing.card,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: c.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name="Plus" size={24} color={c.surface} strokeWidth={2} />
    </Pressable>
  );
}
