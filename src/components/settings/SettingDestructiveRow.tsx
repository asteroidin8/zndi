import { Pressable } from 'react-native';

import { AppText } from '../AppText';
import { settingCompactRowStyle } from './settingStyles';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label: string;
  onPress: () => void;
};

export function SettingDestructiveRow({ label, onPress }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        ...settingCompactRowStyle(),
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppText variant="body" style={{ color: c.danger, fontWeight: '500' }} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}
