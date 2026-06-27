import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { EmptyIllustration } from './EmptyIllustration';
import { useThemeColors } from '@/hooks/useThemeColors';
import { radius, spacing } from '@/constants/spacing';

type Props = {
  message: string;
  variant?: 'todo' | 'routine' | 'fasting' | 'stats';
  /** true = 스크롤 내부 섹션용 (flex:1 없이 패딩만) */
  inline?: boolean;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export function EmptyState({ message, variant = 'todo', inline, ctaLabel, onCtaPress }: Props) {
  const c = useThemeColors();
  return (
    <View
      style={
        inline
          ? { alignItems: 'center', paddingVertical: 40, gap: 12 }
          : { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 }
      }
    >
      <EmptyIllustration variant={variant} />
      <AppText variant="body" tone="tertiary" style={{ textAlign: 'center', lineHeight: 22 }}>
        {message}
      </AppText>
      {ctaLabel && onCtaPress && (
        <Pressable
          onPress={onCtaPress}
          style={{
            marginTop: spacing.sm,
            paddingHorizontal: spacing.card + 4,
            paddingVertical: spacing.sm + 2,
            borderRadius: radius.xl,
            backgroundColor: c.primary,
          }}
        >
          <AppText variant="body" style={{ color: '#fff', fontWeight: '600' }}>
            {ctaLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
