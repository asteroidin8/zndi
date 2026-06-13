import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = React.ComponentProps<typeof AppIcon>['name'];

type Props = {
  title: string;
  description?: string;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

function bannerStyle(c: ReturnType<typeof useThemeColors>): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.surfaceSubtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.card,
    paddingVertical: spacing.sm,
  };
}

function BannerContent({ title, description, icon = 'UserCircle' }: Pick<Props, 'title' | 'description' | 'icon'>) {
  const c = useThemeColors();

  return (
    <>
      <AppIcon name={icon} size={18} color={c.inkTertiary} />
      <View style={{ flex: 1, gap: spacing.xs, justifyContent: 'center' }}>
        <AppText variant="caption" tone="secondary" style={{ fontWeight: '600' }}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="tertiary" style={{ lineHeight: 17 }}>
            {description}
          </AppText>
        ) : null}
      </View>
    </>
  );
}

export function InfoBanner({ title, description, icon, onPress, style, accessibilityLabel }: Props) {
  const c = useThemeColors();
  const baseStyle = bannerStyle(c);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.88 : 1 }, style]}
      >
        <BannerContent title={title} description={description} icon={icon} />
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]}>
      <BannerContent title={title} description={description} icon={icon} />
    </View>
  );
}
