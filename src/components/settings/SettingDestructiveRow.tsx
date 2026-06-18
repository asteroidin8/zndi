import { View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { BaseSettingItem } from './BaseSettingItem';
import { settingRowLabelStyle } from './settingStyles';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = React.ComponentProps<typeof AppIcon>['name'];

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
};

export function SettingDestructiveRow({ label, onPress, icon }: Props) {
  const c = useThemeColors();

  return (
    <BaseSettingItem onPress={onPress} accessibilityLabel={label}>
      {icon ? (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            backgroundColor: c.danger,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <AppIcon name={icon} size={15} color="#ffffff" strokeWidth={2} />
        </View>
      ) : null}
      <AppText
        variant="body"
        style={[settingRowLabelStyle(), { color: c.danger, fontWeight: '500' }]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </BaseSettingItem>
  );
}

/** @alias SettingDestructiveRow */
export const SettingDangerRow = SettingDestructiveRow;
