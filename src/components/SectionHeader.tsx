import { View } from 'react-native';

import { AppText } from './AppText';
import { spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  title: string;
  /** 설정 화면 등 캡션 스타일 */
  variant?: 'bar' | 'caption';
};

export function SectionHeader({ title, variant = 'bar' }: Props) {
  const c = useThemeColors();

  if (variant === 'caption') {
    return (
      <AppText
        variant="caption"
        tone="tertiary"
        style={{ paddingTop: spacing.section, paddingBottom: spacing.sm, paddingHorizontal: spacing.screen }}
      >
        {title}
      </AppText>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
      <View style={{ width: 3, height: 14, backgroundColor: c.ink, borderRadius: 2 }} />
      <AppText variant="body" style={{ fontWeight: '700' }}>
        {title}
      </AppText>
    </View>
  );
}
