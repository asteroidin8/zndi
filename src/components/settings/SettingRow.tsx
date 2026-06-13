import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { settingCompactRowStyle, settingRowTrailingStyle } from './settingStyles';
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

  const labelNode = (
    <AppText
      variant="body"
      tone={danger ? 'tertiary' : 'primary'}
      style={danger ? { color: c.danger } : undefined}
      numberOfLines={1}
    >
      {label}
    </AppText>
  );

  const trailingNode = trailing ?? (
    value !== undefined && (
      <View style={settingRowTrailingStyle()}>
        <AppText
          variant="body"
          tone={unset ? 'tertiary' : 'secondary'}
          numberOfLines={1}
        >
          {value}
        </AppText>
        {showChevron && interactive && (
          <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />
        )}
      </View>
    )
  );

  if (!interactive) {
    return (
      <View style={rowStyle} accessibilityLabel={label}>
        {labelNode}
        {trailingNode}
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
      {labelNode}
      {trailingNode}
    </Pressable>
  );
}
