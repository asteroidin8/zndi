import { View } from 'react-native';

import { AppText } from '../AppText';
import { BaseSettingItem } from './BaseSettingItem';
import { settingRowLabelStyle } from './settingStyles';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label: string;
  onPress: () => void;
};

export function SettingDestructiveRow({ label, onPress }: Props) {
  const c = useThemeColors();

  return (
    <BaseSettingItem onPress={onPress} accessibilityLabel={label}>
      <View style={settingRowLabelStyle()}>
        <AppText
          variant="body"
          style={{ color: c.danger, fontWeight: '500' }}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </BaseSettingItem>
  );
}

/** @alias SettingDestructiveRow */
export const SettingDangerRow = SettingDestructiveRow;
