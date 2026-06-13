import { Switch, View } from 'react-native';

import { AppText } from '../AppText';
import { settingRowStyle } from './settingStyles';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
};

export function SettingToggleRow({ label, description, value, onToggle }: Props) {
  const c = useThemeColors();

  return (
    <View style={settingRowStyle()}>
      <View style={{ flex: 1, gap: spacing.xs, justifyContent: 'center', minWidth: 0 }}>
        <AppText variant="body">{label}</AppText>
        {description && (
          <AppText variant="caption" tone="tertiary" style={{ lineHeight: 17 }}>
            {description}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.surfaceMuted, true: c.ink }}
        thumbColor={c.surface}
        accessibilityLabel={description ? `${label}, ${description}` : label}
      />
    </View>
  );
}
