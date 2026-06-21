import { Pressable, Switch, View } from 'react-native';
import type * as LucideIcons from 'lucide-react-native';

import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconName = keyof typeof LucideIcons;

export function GroupCard({ children }: { children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.surfaceSubtle,
        borderRadius: radius.lg,
        overflow: 'hidden',
        paddingVertical: spacing.xs,
      }}
    >
      {children}
    </View>
  );
}

export function Row({
  label,
  value,
  unset,
  icon,
  onPress,
}: {
  label: string;
  value?: string;
  unset?: boolean;
  icon?: IconName;
  onPress?: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: spacing.card,
        backgroundColor: pressed && onPress ? c.surfaceMuted : 'transparent',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {icon && <AppIcon name={icon} size={16} color={c.inkTertiary} />}
        <AppText variant="body">{label}</AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {value != null && (
          <AppText variant="body" tone={unset ? 'disabled' : 'tertiary'}>
            {value}
          </AppText>
        )}
        {onPress && <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />}
      </View>
    </Pressable>
  );
}

export function DangerRow({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingHorizontal: spacing.card,
        backgroundColor: pressed ? c.surfaceMuted : 'transparent',
      })}
    >
      <View style={{ width: 16, alignItems: 'center', marginRight: spacing.sm }}>
        <View style={{ width: 3, height: 16, backgroundColor: c.danger, borderRadius: 2 }} />
      </View>
      <AppText variant="body" style={{ color: c.danger }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingHorizontal: spacing.card,
        paddingVertical: spacing.sm,
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body">{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
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
    </View>
  );
}

export function InsetDivider() {
  const c = useThemeColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: c.borderNeutral,
        marginLeft: spacing.card,
      }}
    />
  );
}

export function PageHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screen,
        paddingTop: spacing.item,
        paddingBottom: spacing.sm,
        gap: spacing.item,
      }}
    >
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로">
        <AppIcon name="ChevronLeft" size={20} color={c.ink} />
      </Pressable>
      <AppText variant="title">{title}</AppText>
    </View>
  );
}
