import { Pressable, View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import {
  SETTING_CONTROL_HEIGHT,
  settingSegmentRowStyle,
} from './settingStyles';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = React.ComponentProps<typeof AppIcon>['name'];

export type SegmentOption<T extends string | boolean> = {
  value: T;
  label: string;
  icon?: IconName;
};

type Props<T extends string | boolean> = {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowDeselect?: boolean;
  /** inline: row trailing / full: 카드 단일 row */
  layout?: 'inline' | 'full';
  /** settings: neutral selected (no primary green) */
  tone?: 'default' | 'settings';
};

type SegmentButtonProps = {
  label: string;
  icon?: IconName;
  selected: boolean;
  flex?: number;
  onPress: () => void;
};

function SegmentButton({ label, icon, selected, flex, onPress, tone = 'default' }: SegmentButtonProps & { tone?: 'default' | 'settings' }) {
  const c = useThemeColors();
  const neutral = tone === 'settings';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex,
        flexShrink: flex ? undefined : 0,
        height: SETTING_CONTROL_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: selected ? (neutral ? c.ink : c.primary) : c.surfaceMuted,
        borderWidth: 1,
        borderColor: selected ? (neutral ? c.ink : c.primary) : c.borderNeutral,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {icon && (
        <AppIcon
          name={icon}
          size={14}
          color={selected ? (neutral ? c.surface : c.onPrimary) : c.inkTertiary}
        />
      )}
      <AppText
        variant="caption"
        style={{
          fontWeight: selected ? '700' : '600',
          color: selected ? (neutral ? c.surface : c.onPrimary) : c.ink,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function SettingSegmentTrack<T extends string | boolean>({
  options,
  value,
  onChange,
  allowDeselect = false,
  layout = 'full',
  tone = 'default',
}: Props<T>) {
  const isInline = layout === 'inline';

  return (
    <View style={isInline ? { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } : settingSegmentRowStyle()}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <SegmentButton
            key={String(opt.value)}
            label={opt.label}
            icon={opt.icon}
            selected={selected}
            flex={isInline ? undefined : 1}
            onPress={() => {
              if (allowDeselect && selected) onChange(null);
              else onChange(opt.value);
            }}
            tone={tone}
          />
        );
      })}
    </View>
  );
}
