import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = React.ComponentProps<typeof AppIcon>['name'];

type Props = {
  title: string;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function InfoBanner({ title, icon = 'UserCircle', onPress, style, accessibilityLabel }: Props) {
  const c = useThemeColors();

  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.surfaceSubtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.md,
  };

  const content = (
    <>
      <AppIcon name={icon} size={18} color={c.inkTertiary} />
      <AppText variant="caption" tone="secondary" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
        {title}
      </AppText>
      {onPress && <AppIcon name="ChevronRight" size={16} color={c.inkDisabled} />}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.88 : 1 }, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{content}</View>;
}
