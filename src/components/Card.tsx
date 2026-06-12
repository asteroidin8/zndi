import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  padded?: boolean;
  pressable?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padded = true, pressable, style, ...props }: Props) {
  const c = useThemeColors();

  const cardStyle: ViewStyle = {
    backgroundColor: c.surfaceSubtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: padded ? spacing.card : 0,
    overflow: 'hidden',
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

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
}
