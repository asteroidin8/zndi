import type { ReactNode } from 'react';

import { AppText } from '../AppText';
import { BaseSettingItem } from './BaseSettingItem';
import { settingRowLabelStyle } from './settingStyles';
import { SettingValueAccessory } from './SettingValueAccessory';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label: string;
  value?: string;
  unset?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
};

export function SettingRow({
  label,
  value,
  unset,
  trailing,
  onPress,
  danger,
  showChevron = Boolean(onPress),
}: Props) {
  const c = useThemeColors();

  const labelNode = (
    <AppText
      variant="body"
      tone={danger ? 'tertiary' : 'primary'}
      style={[settingRowLabelStyle(), danger ? { color: c.danger } : undefined]}
      numberOfLines={1}
    >
      {label}
    </AppText>
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
      {labelNode}
      {trailingNode}
    </BaseSettingItem>
  );
}
