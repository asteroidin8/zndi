import { View } from 'react-native';

import { AppText } from '../AppText';
import { Card } from '../Card';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  footer?: string;
  /** 카드 없이 children만 (데이터 destructive 등) */
  bare?: boolean;
  children: React.ReactNode;
};

export function SettingSection({ title, footer, bare, children }: Props) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" tone="tertiary">
        {title}
      </AppText>
      {bare ? children : <Card padded={false}>{children}</Card>}
      {footer && (
        <AppText variant="caption" tone="tertiary" style={{ lineHeight: 17, paddingTop: spacing.xs }}>
          {footer}
        </AppText>
      )}
    </View>
  );
}
