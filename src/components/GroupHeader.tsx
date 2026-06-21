import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ItemGroup } from '@/types';

type Props = {
  group: ItemGroup;
  completedCount: number;
  totalCount: number;
  hasVisibleItems: boolean;
  showDelete: boolean;
  onToggleCollapse: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function GroupHeader({
  group,
  completedCount,
  totalCount,
  hasVisibleItems,
  showDelete,
  onToggleCollapse,
  onRename,
  onDelete,
}: Props) {
  const c = useThemeColors();
  const rotation = useSharedValue(group.collapsed ? -90 : 0);
  const allDone = totalCount > 0 && completedCount === totalCount;
  const openBottom = hasVisibleItems && !group.collapsed;

  useEffect(() => {
    rotation.value = withTiming(group.collapsed ? -90 : 0, { duration: 200 });
  }, [group.collapsed, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const borderColor = allDone ? `${c.primary}30` : c.borderNeutral;

  return (
    <Pressable
      onPress={onToggleCollapse}
      onLongPress={onRename}
      accessibilityRole="button"
      accessibilityLabel={`${group.name} 그룹, ${completedCount}/${totalCount} 완료`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.screen,
        marginHorizontal: spacing.screen,
        marginTop: spacing.sm,
        borderTopLeftRadius: radius.md,
        borderTopRightRadius: radius.md,
        borderBottomLeftRadius: openBottom ? 0 : radius.md,
        borderBottomRightRadius: openBottom ? 0 : radius.md,
        backgroundColor: c.surfaceSubtle,
        borderWidth: 1,
        borderBottomWidth: openBottom ? 0 : 1,
        borderColor,
      }}
    >
      <Animated.View style={chevronStyle}>
        <AppIcon name="ChevronDown" size={14} color={allDone ? c.primary : c.inkTertiary} />
      </Animated.View>
      <AppText
        variant="body"
        style={{
          fontWeight: '600',
          flex: 1,
          marginLeft: spacing.sm,
          color: allDone ? c.primary : c.ink,
        }}
      >
        {group.name}
      </AppText>
      {allDone ? (
        <AppText variant="caption" style={{ color: c.primary, fontWeight: '700' }}>✓</AppText>
      ) : (
        <AppText variant="caption" tone="disabled">
          {completedCount}/{totalCount}
        </AppText>
      )}
      {showDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${group.name} 그룹 삭제`}
          style={{ marginLeft: spacing.sm }}
        >
          <AppIcon name="Trash2" size={14} color={c.danger} />
        </Pressable>
      )}
    </Pressable>
  );
}
