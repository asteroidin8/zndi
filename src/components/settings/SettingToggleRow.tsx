import { Switch, View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { BaseSettingItem } from './BaseSettingItem';
import { settingRowLabelStyle } from './settingStyles';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = React.ComponentProps<typeof AppIcon>['name'];

type Props = {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  description?: string;
  icon?: IconName;
  iconColor?: string;
};

export function SettingToggleRow({
  label,
  value,
  onToggle,
  description,
  icon,
  iconColor,
}: Props) {
  const c = useThemeColors();

  return (
    <BaseSettingItem accessibilityLabel={label}>
      {icon ? (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            backgroundColor: iconColor ?? c.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon} size={15} color="#ffffff" strokeWidth={2} />
        </View>
      ) : null}
      <View style={settingRowLabelStyle()}>
        <AppText variant="body" numberOfLines={1}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="tertiary" numberOfLines={2} style={{ marginTop: 2 }}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.surfaceMuted, true: c.primary }}
        thumbColor={value ? c.onPrimary : c.inkTertiary}
        ios_backgroundColor={c.surfaceMuted}
        accessibilityLabel={label}
      />
    </BaseSettingItem>
  );
}
