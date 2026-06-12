import { Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  pinned: boolean;
  onToggle: () => void;
};

export function HomePinToggle({ pinned, onToggle }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: pinned }}
      accessibilityLabel="홈에 고정"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: pinned ? c.ink : c.border,
        backgroundColor: pinned ? c.surfaceSubtle : 'transparent',
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2, paddingRight: 12 }}>
        <AppText variant="body" style={{ fontWeight: '600' }}>
          홈에 고정
        </AppText>
        <AppText variant="caption" tone="tertiary">
          홈 화면 할 일에 우선 표시해요 (최대 3개)
        </AppText>
      </View>
      <AppIcon name={pinned ? 'Pin' : 'PinOff'} size={18} color={pinned ? c.ink : c.inkTertiary} />
    </Pressable>
  );
}
