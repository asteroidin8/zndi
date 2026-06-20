import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { EmptyIllustration } from './EmptyIllustration';

type Props = {
  message: string;
  variant?: 'todo' | 'routine' | 'fasting' | 'stats';
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ message, variant = 'todo', actionLabel, onAction }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 }}>
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
