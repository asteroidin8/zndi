import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

const TAB_BAR_HEIGHT = 52;

type SpeedDialAction = {
  label: string;
  icon: 'Plus' | 'FolderPlus' | 'Pencil';
  onPress: () => void;
};

type Props = {
  actions: SpeedDialAction[];
  accessibilityLabel: string;
};

export function SpeedDialFab({ actions, accessibilityLabel }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 6) + spacing.card;

  function handleAction(action: SpeedDialAction) {
    setOpen(false);
    action.onPress();
  }

  return (
    <>
      {open && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="메뉴 닫기"
          />
        </Animated.View>
      )}

      {open &&
        actions.map((action, i) => (
          <Animated.View
            key={action.label}
            entering={SlideInDown.duration(200).delay(i * 50)}
            exiting={SlideOutDown.duration(150)}
            style={{
              position: 'absolute',
              right: spacing.screen,
              bottom: bottom + 60 + i * 52,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                backgroundColor: c.surfaceCard,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              <AppText variant="caption" style={{ fontWeight: '600' }}>
                {action.label}
              </AppText>
            </View>
            <Pressable
              onPress={() => handleAction(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              <AppIcon name={action.icon} size={20} color={c.ink} />
            </Pressable>
          </Animated.View>
        ))}

      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={open ? '메뉴 닫기' : accessibilityLabel}
        style={{
          position: 'absolute',
          right: spacing.screen,
          bottom,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: c.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon
          name={open ? 'X' : 'Plus'}
          size={24}
          color={c.surface}
          strokeWidth={2}
        />
      </Pressable>
    </>
  );
}
