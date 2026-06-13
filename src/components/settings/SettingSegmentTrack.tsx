import { Pressable, View } from 'react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { SETTING_ROW_HEIGHT } from './settingStyles';
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
  /** inline: row 내부 / full: 카드 전체 너비 */
  layout?: 'inline' | 'full';
};

export function SettingSegmentTrack<T extends string | boolean>({
  options,
  value,
  onChange,
  allowDeselect = false,
  layout = 'full',
}: Props<T>) {
  const c = useThemeColors();
  const isInline = layout === 'inline';
  const stackedIcon = !isInline && options.some((o) => o.icon);
  const buttonMinHeight = isInline ? spacing.section : SETTING_ROW_HEIGHT - spacing.sm;

  return (
    <View
      style={{
        flexDirection: 'row',
        flex: isInline ? 1 : undefined,
        flexShrink: isInline ? 1 : undefined,
        backgroundColor: c.surfaceMuted,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.borderStrong,
        padding: spacing.xs,
        gap: spacing.xs,
      }}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              if (allowDeselect && selected) onChange(null);
              else onChange(opt.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: buttonMinHeight,
              flexDirection: stackedIcon ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: stackedIcon ? spacing.xs : 0,
              paddingHorizontal: isInline ? spacing.sm : spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.sm,
              backgroundColor: selected ? c.ink : c.surface,
              borderWidth: selected ? 0 : 1,
              borderColor: c.borderStrong,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            {opt.icon && (
              <AppIcon
                name={opt.icon}
                size={isInline ? 14 : 16}
                color={selected ? c.surface : c.inkTertiary}
              />
            )}
            <AppText
              variant="caption"
              style={{
                fontWeight: selected ? '700' : '600',
                color: selected ? c.surface : c.ink,
              }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
