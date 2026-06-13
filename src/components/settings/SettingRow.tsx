import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import {
  settingCompactRowStyle,
  settingRowLabelStyle,
  settingRowTrailingStyle,
} from './settingStyles';
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
  const interactive = Boolean(onPress);
  const rowStyle = settingCompactRowStyle();

  const content = (
    <>
      <AppText
        variant="body"
        tone={danger ? 'tertiary' : 'primary'}
        style={[settingRowLabelStyle(), danger ? { color: c.danger } : undefined]}
        numberOfLines={1}
      >
        {label}
      </AppText>
      {trailing ?? (
        (value !== undefined || (interactive && showChevron)) && (
          <View style={settingRowTrailingStyle()}>
            {value !== undefined && (
              <AppText variant="body" tone={unset ? 'tertiary' : 'secondary'} numberOfLines={1}>
                {value}
              </AppText>
            )}
            {showChevron && interactive && (
              <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />
            )}
          </View>
        )
      )}
    </>
  );

  if (!interactive) {
    return (
      <View style={rowStyle} accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => ({
        ...rowStyle,
        backgroundColor: pressed ? c.surfaceMuted : 'transparent',
      })}
    >
      {content}
    </Pressable>
  );
}
