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
  /** inline: row trailing / full: 카드 단일 row */
  layout?: 'inline' | 'full';
};

const INLINE_SHELL_PADDING = spacing.xs;
const FULL_SHELL_PADDING_Y = spacing.xs;

function segmentButtonHeight(isInline: boolean) {
  const shellY = isInline ? INLINE_SHELL_PADDING * 2 : FULL_SHELL_PADDING_Y * 2;
  return SETTING_ROW_HEIGHT - shellY;
}

export function SettingSegmentTrack<T extends string | boolean>({
  options,
  value,
  onChange,
  allowDeselect = false,
  layout = 'full',
}: Props<T>) {
  const c = useThemeColors();
  const isInline = layout === 'inline';
  const buttonHeight = segmentButtonHeight(isInline);

  return (
    <View
      style={
        isInline
          ? {
              flexDirection: 'row',
              flexShrink: 0,
              alignItems: 'center',
              gap: spacing.xs,
              padding: INLINE_SHELL_PADDING,
              backgroundColor: c.surfaceMuted,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: c.borderStrong,
            }
          : {
              flexDirection: 'row',
              alignItems: 'center',
              height: SETTING_ROW_HEIGHT,
              paddingHorizontal: spacing.card,
              paddingVertical: FULL_SHELL_PADDING_Y,
              gap: spacing.xs,
            }
      }
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
              flex: isInline ? undefined : 1,
              flexShrink: isInline ? 0 : undefined,
              height: buttonHeight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
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
                size={14}
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
