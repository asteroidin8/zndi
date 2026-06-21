import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDelete: () => void;
};

export function EditBottomBar({ selectedCount, totalCount, onSelectAll, onDelete }: Props) {
  const c = useThemeColors();
  const allSelected = selectedCount === totalCount && totalCount > 0;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screen,
        paddingVertical: spacing.md,
        paddingBottom: spacing.section,
        backgroundColor: c.surfaceSubtle,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      <Pressable
        onPress={onSelectAll}
        hitSlop={8}
        accessibilityRole="button"
        style={{ flex: 1, alignItems: 'flex-start' }}
      >
        <AppText variant="body" style={{ fontWeight: '600' }}>
          {allSelected ? '선택 해제' : '전체 선택'}
        </AppText>
      </Pressable>

      <AppText variant="caption" tone="tertiary" style={{ flex: 1, textAlign: 'center' }}>
        {selectedCount}개 선택됨
      </AppText>

      <Pressable
        onPress={onDelete}
        disabled={selectedCount === 0}
        hitSlop={8}
        accessibilityRole="button"
        style={{
          flex: 1,
          alignItems: 'flex-end',
          opacity: selectedCount === 0 ? 0.4 : 1,
        }}
      >
        <AppText variant="body" style={{ color: c.danger, fontWeight: '600' }}>삭제</AppText>
      </Pressable>
    </View>
  );
}
