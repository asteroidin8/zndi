import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { neonGlowShadow } from '@/constants/themeEffects';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  padded?: boolean;
  pressable?: boolean;
  /** elevated = surfaceCard 배경 */
  variant?: 'default' | 'elevated' | 'settings';
  glow?: boolean | 'soft' | 'strong';
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  padded = true,
  pressable,
  variant = 'default',
  glow,
  style,
  ...props
}: Props) {
  const c = useThemeColors();

  const isSettings = variant === 'settings';
  const cardStyle: ViewStyle = {
    backgroundColor: isSettings ? c.surfaceSubtle : variant === 'elevated' ? c.surfaceCard : c.surfaceSubtle,
    borderRadius: isSettings ? radius.lg : radius.xl,
    borderWidth: isSettings ? 0 : 1,
    borderColor: isSettings ? 'transparent' : c.border,
    ...(padded ? { padding: spacing.card } : {}),
    overflow: isSettings ? 'visible' : 'hidden',
    ...(isSettings || !glow
      ? {}
      : glow === true || glow === 'soft'
        ? neonGlowShadow(c, 'soft')
        : glow === 'strong'
          ? neonGlowShadow(c, 'strong')
          : {}),
  };

  if (pressable) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
          style,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
