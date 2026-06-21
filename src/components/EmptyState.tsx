import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { EmptyIllustration } from './EmptyIllustration';

type Props = {
  message: string;
  variant?: 'todo' | 'routine' | 'fasting' | 'stats';
  actionLabel?: string;
  onAction?: () => void;
  /** true = 스크롤 내부 섹션용 (flex:1 없이 패딩만) */
  inline?: boolean;
};

export function EmptyState({ message, variant = 'todo', actionLabel, onAction, inline }: Props) {
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
      {actionLabel && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <AppText variant="caption" tone="secondary" style={{ textDecorationLine: 'underline' }}>
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
