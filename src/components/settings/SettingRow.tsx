import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { BaseSettingItem } from './BaseSettingItem';
import { settingRowLabelStyle } from './settingStyles';
import { SettingValueAccessory } from './SettingValueAccessory';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = React.ComponentProps<typeof AppIcon>['name'];

type Props = {
  label: string;
  value?: string;
  unset?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  icon?: IconName;
  iconColor?: string;
  description?: string;
};

export function SettingRow({
  label,
  value,
  unset,
  trailing,
  onPress,
  danger,
  showChevron = Boolean(onPress),
  icon,
  iconColor,
  description,
}: Props) {
  const c = useThemeColors();

  const iconNode = icon ? (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        backgroundColor: iconColor ?? c.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
      }}
    >
      <AppIcon name={icon} size={15} color="#ffffff" strokeWidth={2} />
    </View>
  ) : null;

  const labelNode = (
    <View style={settingRowLabelStyle()}>
      <AppText
        variant="body"
        tone={danger ? 'tertiary' : 'primary'}
        style={danger ? { color: c.danger } : undefined}
        numberOfLines={1}
      >
        {label}
      </AppText>
      {description ? (
        <AppText variant="caption" tone="tertiary" numberOfLines={2} style={{ marginTop: 2 }}>
          {description}
        </AppText>
      ) : null}
    </View>
  );

  const trailingNode = (() => {
    if (trailing != null) return trailing;
    if (value !== undefined || showChevron) {
      return (
        <SettingValueAccessory value={value} unset={unset} showChevron={showChevron} />
      );
    }
    return null;
  })();

  return (
    <BaseSettingItem
      onPress={onPress}
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      {iconNode}
      {labelNode}
      {trailingNode}
    </BaseSettingItem>
  );
}
